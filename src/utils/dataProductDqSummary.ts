import type { DataProduct, DQDimension } from '../data/mock/types';
import type { DQRule } from '../data/mock/types';
import { getRuleDimension } from './dqDimensions';
import { dqRuleTemplates } from '../data/mock';

export type DqStatus = 'green' | 'amber' | 'red' | 'grey';

export interface DimensionDqSummary {
  ruleCount: number;
  passedCount: number;
  scorePct: number | null;
  status: DqStatus;
}

export interface DataProductDqSummary {
  assetCount: number;
  ruleCount: number;
  passedCount: number;
  /** 0–100 when there are rules; null when no rules. */
  scorePct: number | null;
  status: DqStatus;
  /** Per-dimension breakdown (only dimensions that have rules). */
  byDimension: Partial<Record<DQDimension, DimensionDqSummary>>;
}

function statusFromScore(scorePct: number | null): DqStatus {
  if (scorePct === null) return 'grey';
  if (scorePct >= 90) return 'green';
  if (scorePct >= 60) return 'amber';
  return 'red';
}

const getTemplate = (id: string) => dqRuleTemplates.find((t) => t.id === id);

/**
 * Compute DQ summary for a data product: asset count, rule count, pass rate, RAG status, and per-dimension breakdown.
 * Rules are those (static + runtime) whose assetId is in the product's data assets.
 * RAG: green >= 90%, amber >= 60%, red < 60%, grey = no rules.
 */
export function getDataProductDqSummary(
  dataProduct: DataProduct,
  staticRules: DQRule[],
  runtimeRules: DQRule[]
): DataProductDqSummary {
  const assetIds = new Set(dataProduct.outputPortAssetIds);
  const assetCount = assetIds.size;
  const allRules = [...staticRules, ...runtimeRules].filter((r) => assetIds.has(r.assetId));
  const ruleCount = allRules.length;
  const withResult = allRules.filter((r) => r.lastRunPassed !== undefined);
  const passedCount = withResult.filter((r) => r.lastRunPassed === true).length;
  const totalWithResult = withResult.length;
  const scorePct = totalWithResult === 0 ? null : Math.round((passedCount / totalWithResult) * 100);
  const status = statusFromScore(scorePct);

  const byDimension: Partial<Record<DQDimension, DimensionDqSummary>> = {};
  const rulesByDim = new Map<DQDimension, DQRule[]>();
  for (const r of allRules) {
    const dim = getRuleDimension(r, getTemplate);
    if (!rulesByDim.has(dim)) rulesByDim.set(dim, []);
    rulesByDim.get(dim)!.push(r);
  }
  for (const [dim, rules] of rulesByDim) {
    const withRes = rules.filter((r) => r.lastRunPassed !== undefined);
    const passed = withRes.filter((r) => r.lastRunPassed === true).length;
    const total = withRes.length;
    const dimScorePct = total === 0 ? null : Math.round((passed / total) * 100);
    byDimension[dim] = {
      ruleCount: rules.length,
      passedCount: passed,
      scorePct: dimScorePct,
      status: statusFromScore(dimScorePct),
    };
  }

  return { assetCount, ruleCount, passedCount, scorePct, status, byDimension };
}

export interface DimensionAggregate {
  dimension: DQDimension;
  ruleCount: number;
  passedCount: number;
  scorePct: number | null;
  status: DqStatus;
}

/**
 * Compute per-dimension DQ stats for a set of assets (e.g. filtered catalog). Used by Insights.
 */
export function getDqSummaryByDimensionForAssets(
  assetIds: Set<string>,
  staticRules: DQRule[],
  runtimeRules: DQRule[]
): DimensionAggregate[] {
  const allRules = [...staticRules, ...runtimeRules].filter((r) => assetIds.has(r.assetId));
  const rulesByDim = new Map<DQDimension, DQRule[]>();
  for (const r of allRules) {
    const dim = getRuleDimension(r, getTemplate);
    if (!rulesByDim.has(dim)) rulesByDim.set(dim, []);
    rulesByDim.get(dim)!.push(r);
  }
  const result: DimensionAggregate[] = [];
  for (const [dim, rules] of rulesByDim) {
    const withRes = rules.filter((r) => r.lastRunPassed !== undefined);
    const passed = withRes.filter((r) => r.lastRunPassed === true).length;
    const total = withRes.length;
    const scorePct = total === 0 ? null : Math.round((passed / total) * 100);
    result.push({
      dimension: dim,
      ruleCount: rules.length,
      passedCount: passed,
      scorePct,
      status: statusFromScore(scorePct),
    });
  }
  return result;
}
