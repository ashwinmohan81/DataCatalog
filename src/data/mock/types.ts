/** Shared types for mock data */

export type AssetType = 'table' | 'file' | 'api' | 'dashboard' | 'pipeline';

/** Platform/source type for categorization (OpenMetadata/DataHub-style). */
export type AssetPlatform =
  | 'postgres'
  | 'oracle'
  | 'snowflake'
  | 'bigquery'
  | 's3'
  | 'rest_api'
  | 'kafka'
  | 'mysql'
  | 'other';

/** Tier 1 = Key/Golden source, Tier 2 = Standard, Tier 3 = Supporting */
export type AssetTier = 1 | 2 | 3;

/** Medallion-style zone: raw (bronze), enriched (silver), conformed (gold). */
export type AssetZone = 'raw' | 'enriched' | 'conformed';

export type ApplicationType = 'producer' | 'consumer';

export interface Application {
  id: string;
  name: string;
  description: string;
  owner: string;
  type: ApplicationType;
  connectorIds?: string[];
  consumedDataProductIds?: string[];
}

export type TaskStatus = 'open' | 'in_progress' | 'done';

export type DQRuleType = 'null_check' | 'uniqueness' | 'range' | 'regex' | 'custom_sql';

export type Maturity = 'mapped' | 'partial' | 'unmapped';

export interface Domain {
  id: string;
  name: string;
  description: string;
  subdomains: Subdomain[];
}

export interface Subdomain {
  id: string;
  name: string;
  domainId: string;
  dataProducts: DataProduct[];
}

export interface DataProduct {
  id: string;
  name: string;
  description: string;
  subdomainId: string;
  domainId: string;
  owner: string;
  ownerEmail: string;
  sla?: string;
  outputPortAssetIds: string[];
  contractId?: string;
  tags: string[];
  certified: boolean;
}

export interface DataAsset {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: AssetType;
  tier: AssetTier;
  /** Producer application that owns this asset (physical inventory). */
  applicationId?: string;
  /** Medallion zone: raw, enriched, conformed. */
  zone?: AssetZone | null;
  domainId: string;
  subdomainId: string;
  dataProductId: string;
  isOutputPort: boolean;
  owner: string;
  ownerEmail: string;
  connectorId?: string;
  connectorName?: string;
  /** Platform/source type (e.g. postgres, s3, kafka) for filter and browse. */
  platform?: AssetPlatform;
  lastScanAt?: string;
  certified: boolean;
  tags: string[];
  columns: Column[];
  profile?: ProfileStats;
  versions: AssetVersion[];
  contractId?: string;
}

export interface Column {
  id: string;
  name: string;
  type: string;
  description?: string;
  glossaryTermIds: string[];
  logicalAttributeId?: string;
  tags: string[];
  profile?: ColumnProfile;
}

export interface ColumnProfile {
  rowCount: number;
  distinctCount: number;
  nullCount: number;
  min?: string;
  max?: string;
}

export interface ProfileStats {
  rowCount: number;
  columnCount: number;
  lastScanAt: string;
}

export interface AssetVersion {
  id: string;
  version: number;
  label: string;
  at: string;
  by: string;
  changeSummary: string;
}

export interface Glossary {
  id: string;
  name: string;
  description: string;
  owner: string;
  steward?: string;
  /** Glossary IDs this glossary is linked to (e.g. domain glossary links to enterprise). */
  linkedGlossaryIds: string[];
}

export interface GlossaryTerm {
  id: string;
  glossaryId: string;
  name: string;
  definition: string;
  synonyms: string[];
  owner: string;
  steward: string;
  tags: string[];
  linkedColumnIds: { assetId: string; columnId: string }[];
}

export interface LineageNode {
  id: string;
  name: string;
  type: 'source' | 'transform' | 'destination';
  system?: string;
  assetId?: string;
}

export interface LineageEdge {
  from: string;
  to: string;
  columnName: string;
}

export interface LineageGraph {
  assetId: string;
  columnId: string;
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface DQRule {
  id: string;
  name: string;
  type: DQRuleType;
  assetId: string;
  columnId?: string;
  config?: Record<string, unknown>;
  sql?: string;
  lastRunAt?: string;
  lastRunPassed?: boolean;
}

export interface DQRun {
  id: string;
  ruleId: string;
  assetId: string;
  runAt: string;
  passed: boolean;
  failedCount?: number;
  sampleFailures?: string[];
}

export interface WorkflowTask {
  id: string;
  title: string;
  description: string;
  assetId: string;
  assetName: string;
  requestedBy: string;
  assignedTo: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

/** Contract lifecycle: consumer requests → producer approves. */
export type ContractStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

/** SLA dimension (e.g. freshness, availability). */
export type ContractSLAType = 'freshness' | 'availability' | 'latency';

export interface ContractSLA {
  type: ContractSLAType;
  /** Human-readable target, e.g. "Daily 06:00 UTC", "99.9%", "&lt; 5 min" */
  target: string;
  unit?: string;
}

/** Snapshot for version history (track changes over time). */
export interface ContractVersionSnapshot {
  version: number;
  at: string;
  by: string;
  changeSummary: string;
  schema?: ContractAttribute[];
  slas?: ContractSLA[];
  dqRuleIds?: string[];
}

export interface DataContract {
  id: string;
  name: string;
  assetId: string;
  version: number;
  createdAt: string;
  createdBy: string;
  status: ContractStatus;
  /** Consumer application that requested this contract (onboarding flow). */
  requestedByApplicationId?: string;
  /** Producer application that approved (owner of asset). */
  approvedByApplicationId?: string;
  approvedAt?: string;
  rejectedReason?: string;
  schema: ContractAttribute[];
  /** Structured SLAs (replaces legacy slo string for display). */
  slas?: ContractSLA[];
  /** Legacy single SLO line; kept for backward compat, prefer slas. */
  slo?: string;
  /** DQ rule IDs from dqRules that are part of this contract. */
  dqRuleIds?: string[];
  /** Legacy free-text quality rules; prefer dqRuleIds. */
  qualityRules?: string[];
  /** Version history for change tracking. */
  versionHistory?: ContractVersionSnapshot[];
}

export interface ContractAttribute {
  id: string;
  name: string;
  type: string;
  description?: string;
  required: boolean;
  glossaryTermId?: string;
}

export interface Connector {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'error';
  lastScanAt?: string;
  schedule?: string;
}

export interface Notification {
  id: string;
  type: 'change_request' | 'dq_failure' | 'contract_approval' | 'task_assigned';
  title: string;
  body: string;
  at: string;
  read: boolean;
  linkAssetId?: string;
  linkTaskId?: string;
}

export type PersonaId = 'consumer' | 'steward' | 'owner' | 'engineer' | 'regulator';

export interface Persona {
  id: PersonaId;
  name: string;
  homePath: string;
  navEmphasis: string[];
}
