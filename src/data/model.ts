/**
 * Data Catalog — canonical data model
 *
 * Supports: Application/zone inventory, medallion view, data contracts (SLAs, schema, DQ, versioning),
 * data products & data assets, glossary terms & column–term linking, fuzzy term recommendations,
 * tag management (custom tags, column tags).
 *
 * Two layers:
 * - Core entities: from mock/backing store (Domain, DataProduct, DataAsset, Application, etc.)
 * - Runtime overlay: in-memory state (contract requests, runtime products, term links, tag overrides)
 */

export * from './mock/types';

// ---------------------------------------------------------------------------
// Link / relationship entities (many-to-many and overrides)
// ---------------------------------------------------------------------------

/** Column ↔ Glossary term: one column can link to multiple terms; one term can link to many columns. */
export interface ColumnTermLink {
  assetId: string;
  columnId: string;
  termId: string;
}

/** Per-column tag assignment (overrides or extends Column.tags). Key = "assetId:columnId". */
export type ColumnTagKey = string;
export function columnTagKey(assetId: string, columnId: string): ColumnTagKey {
  return `${assetId}:${columnId}`;
}

/** Asset → Data product assignment override (when asset is assigned to a runtime-created product). */
export interface AssetDataProductAssignment {
  assetId: string;
  dataProductId: string;
}

// ---------------------------------------------------------------------------
// Runtime catalog state (UI/store overlay on top of core entities)
// ---------------------------------------------------------------------------

import type {
  DataContract,
  DataProduct,
  GlossaryTerm,
} from './mock/types';

/**
 * Runtime-only state that overlays the core catalog.
 * - contractRequests: consumer-requested contracts (pending/approved/rejected)
 * - dataProducts: user-created data products
 * - assetDataProductOverrides: assetId → dataProductId for those products
 * - glossaryTerms: user-created terms
 * - columnTermLinks: column ↔ term links (add/remove without rewriting Column.glossaryTermIds)
 * - customTags: data-owner–managed tag vocabulary
 * - columnTagOverrides: per-column tag list (assetId:columnId → tags)
 */
export interface RuntimeCatalogState {
  contractRequests: DataContract[];
  dataProducts: DataProduct[];
  assetDataProductOverrides: Record<string, string>;
  glossaryTerms: GlossaryTerm[];
  columnTermLinks: ColumnTermLink[];
  customTags: string[];
  columnTagOverrides: Record<ColumnTagKey, string[]>;
}

// ---------------------------------------------------------------------------
// IDs and keys (for API/backend alignment)
// ---------------------------------------------------------------------------

export type DomainId = string;
export type SubdomainId = string;
export type DataProductId = string;
export type DataAssetId = string;
export type ColumnId = string;
export type ApplicationId = string;
export type GlossaryId = string;
export type GlossaryTermId = string;
export type ContractId = string;
export type DQRuleId = string;
export type ConnectorId = string;
