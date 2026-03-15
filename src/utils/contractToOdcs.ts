import type { DataContract, DataAsset, ContractAttribute, ContractSLA, DQRule } from '../data/mock/types';
import { getDomainById, getDataProductWithContext } from '../data/mock';
import yaml from 'js-yaml';

const STATUS_TO_ODCS: Record<DataContract['status'], string> = {
  approved: 'active',
  draft: 'draft',
  pending_approval: 'proposed',
  rejected: 'retired',
};

/** Map catalog type to ODCS logicalType */
function toLogicalType(type: string): string {
  const t = type.toUpperCase();
  if (/INT|BIGINT|SMALLINT|TINYINT/.test(t)) return 'integer';
  if (/DECIMAL|NUMERIC|FLOAT|DOUBLE|REAL|NUMBER/.test(t)) return 'number';
  if (/DATE\b/.test(t) && !/TIMESTAMP|DATETIME/.test(t)) return 'date';
  if (/TIMESTAMP|DATETIME|TIME\b/.test(t)) return 'timestamp';
  if (/BOOL/.test(t)) return 'boolean';
  return 'string';
}

/** ODCS schema property from ContractAttribute */
function attributeToOdcsProperty(attr: ContractAttribute, qualityForProperty: DQRule[]): Record<string, unknown> {
  const prop: Record<string, unknown> = {
    id: attr.id,
    name: attr.name,
    logicalType: toLogicalType(attr.type),
    physicalType: attr.type,
    required: attr.required,
  };
  if (attr.description) prop.description = attr.description;
  if (qualityForProperty.length > 0) {
    prop.quality = qualityForProperty.map((r) => dqRuleToOdcsQuality(r));
  }
  return prop;
}

/** ODCS quality entry from DQRule */
function dqRuleToOdcsQuality(rule: DQRule): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: rule.id,
    description: rule.name,
  };
  switch (rule.type) {
    case 'null_check':
      return { ...base, metric: 'nullValues', mustBe: 0, unit: 'rows' };
    case 'uniqueness':
      return { ...base, metric: 'duplicateValues', mustBe: 0, unit: 'rows' };
    case 'range': {
      const args: Record<string, unknown> = {};
      if (rule.config?.min != null) args.minimum = rule.config.min;
      if (rule.config?.max != null) args.maximum = rule.config.max;
      return {
        ...base,
        metric: 'invalidValues',
        mustBe: 0,
        unit: 'rows',
        ...(Object.keys(args).length > 0 && { arguments: args }),
      };
    }
    case 'regex':
      return {
        ...base,
        metric: 'invalidValues',
        mustBe: 0,
        ...(rule.config?.pattern != null && { arguments: { pattern: rule.config.pattern } }),
      };
    case 'custom_sql':
      return {
        ...base,
        type: 'sql',
        query: rule.sql ?? '',
        mustBe: 0,
      };
    default:
      return { ...base, type: 'custom', engine: rule.engine ?? 'custom', implementation: rule.sql ?? '' };
  }
}

/** Group DQ rules by column name (config.column) for property-level quality */
function groupDqRulesByColumn(rules: DQRule[]): Map<string, DQRule[]> {
  const byColumn = new Map<string, DQRule[]>();
  const tableLevel: DQRule[] = [];
  for (const r of rules) {
    const col = r.config && typeof r.config === 'object' && 'column' in r.config
      ? String((r.config as { column?: string }).column)
      : null;
    if (col) {
      if (!byColumn.has(col)) byColumn.set(col, []);
      byColumn.get(col)!.push(r);
    } else if (r.type === 'custom_sql') {
      tableLevel.push(r);
    } else {
      tableLevel.push(r);
    }
  }
  return byColumn;
}

/** Table-level (object) quality rules (e.g. custom_sql without a single column) */
function getTableLevelQuality(rules: DQRule[]): DQRule[] {
  return rules.filter((r) => r.type === 'custom_sql' || !(r.config && 'column' in r.config));
}

/** Build ODCS-compliant payload from contract, asset, and resolved DQ rules */
export function contractToOdcsPayload(
  contract: DataContract,
  asset: DataAsset | null,
  dqRules: DQRule[]
): Record<string, unknown> {
  const domainName = asset ? getDomainById(asset.domainId)?.name : null;
  const dataProductCtx = asset?.dataProductId ? getDataProductWithContext(asset.dataProductId, []) : null;
  const dataProductName = dataProductCtx?.dataProduct.name ?? null;

  const payload: Record<string, unknown> = {
    apiVersion: 'v3.1.0',
    kind: 'DataContract',
    id: contract.id,
    name: contract.name,
    version: contract.version,
    status: STATUS_TO_ODCS[contract.status],
  };
  if (domainName) payload.domain = domainName;
  if (dataProductName) payload.dataProduct = dataProductName;
  if (asset?.description) {
    payload.description = { purpose: asset.description };
  }

  const tableName = asset?.name ?? 'table';
  const byColumn = groupDqRulesByColumn(dqRules);
  const tableLevelRules = getTableLevelQuality(dqRules);

  const properties: Record<string, unknown>[] = contract.schema.map((attr) => {
    const qualityForProperty = byColumn.get(attr.name) ?? [];
    return attributeToOdcsProperty(attr, qualityForProperty);
  });

  const schemaObject: Record<string, unknown> = {
    id: `obj-${contract.assetId}`,
    name: tableName,
    logicalType: 'object',
    physicalType: 'table',
    properties,
  };
  if (tableLevelRules.length > 0) {
    schemaObject.quality = tableLevelRules.map((r) => dqRuleToOdcsQuality(r));
  }
  payload.schema = [schemaObject];

  if (contract.slas && contract.slas.length > 0) {
    const firstCol = contract.schema[0]?.name;
    const element = firstCol ? `${tableName}.${firstCol}` : tableName;
    payload.slaProperties = contract.slas.map((sla, i) => mapSlaToOdcs(sla, element, i));
  }

  return payload;
}

function mapSlaToOdcs(sla: ContractSLA, element: string, index: number): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: `sla-${index}-${sla.type}`,
    value: sla.target,
    element,
  };
  switch (sla.type) {
    case 'freshness':
      base.property = 'frequency';
      if (sla.unit) base.unit = sla.unit === 'schedule' ? 'd' : sla.unit;
      break;
    case 'availability':
      base.property = 'availability';
      break;
    case 'latency':
      base.property = 'latency';
      if (sla.unit) base.unit = sla.unit;
      break;
    default:
      base.property = sla.type;
  }
  return base;
}

/** Serialize ODCS payload to YAML string */
export function buildOdcsYaml(
  contract: DataContract,
  asset: DataAsset | null,
  dqRules: DQRule[]
): string {
  const payload = contractToOdcsPayload(contract, asset, dqRules);
  return yaml.dump(payload, { lineWidth: -1, noRefs: true });
}
