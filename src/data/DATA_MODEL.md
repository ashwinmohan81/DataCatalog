# Data Catalog — Data Model

Single source of truth for entities and relationships. Implementation: `src/data/model.ts` + `src/data/mock/types.ts`.

---

## 1. Core entities

| Entity | Purpose | Key IDs |
|--------|---------|---------|
| **Domain** | Business domain (e.g. Sales, Finance) | id |
| **Subdomain** | Subdivision; contains DataProducts | id, domainId |
| **DataProduct** | Data product; has data assets | id, subdomainId, domainId, outputPortAssetIds[] |
| **DataAsset** | Table/file/API/etc. | id, applicationId, domainId, subdomainId, dataProductId, platform, zone |
| **Column** | Attribute of an asset | id, glossaryTermIds[], tags[] |
| **Application** | Producer or consumer app | id, type, connectorIds[], consumedDataProductIds[] |
| **Glossary** | Collection of terms | id, linkedGlossaryIds[] |
| **GlossaryTerm** | Term (name, definition, synonyms, tags) | id, glossaryId |
| **DataContract** | Contract for an asset (schema, SLAs, DQ) | id, assetId, requestedByApplicationId, approvedByApplicationId |
| **ContractAttribute** | Contracted column | id, glossaryTermId? |
| **DQRule** | Quality rule | id, assetId, columnId? |
| **Connector** | Scan connector | id |
| **Persona** | UI persona (consumer, steward, owner, …) | id |
| **Notification** | Inbox item | id |
| **WorkflowTask** | Task (e.g. change request) | id, assetId |

---

## 2. Relationships (ER)

```
Domain 1 —— * Subdomain
Subdomain 1 —— * DataProduct
DataProduct * —— * DataAsset   (via outputPortAssetIds; an asset can be output of one product)
DataAsset 1 —— * Column
DataAsset N —— 1 Application   (producer; optional)
Application * —— * DataProduct (consumedDataProductIds)
DataAsset 0..1 —— 1 DataContract (contractId)
DataContract * —— * ContractAttribute
DataContract * —— * DQRule     (dqRuleIds)
DQRule N —— 1 DataAsset
Glossary 1 —— * GlossaryTerm
Column * —— * GlossaryTerm    (via ColumnTermLink; many-to-many)
DataAsset —— Connector (optional)
```

**Medallion / zone:** `DataAsset.zone` ∈ { raw | enriched | conformed }. No separate Zone entity; filter/group by this attribute. Application-scoped medallion = filter assets by `applicationId` + group by `zone`.

**Platform:** `DataAsset.platform` ∈ { postgres | s3 | kafka | … }. Used for catalog/search filters and display.

---

## 3. Runtime overlay (in-memory / store)

These extend or override the core catalog without persisting into the same mock:

| State | Type | Purpose |
|-------|------|---------|
| contractRequests | DataContract[] | Consumer-requested contracts (pending / approved / rejected) |
| dataProducts | DataProduct[] | User-created data products |
| assetDataProductOverrides | assetId → dataProductId | Assign assets to runtime-created products |
| glossaryTerms | GlossaryTerm[] | User-created terms |
| columnTermLinks | ColumnTermLink[] | Column ↔ term links (add/remove) |
| customTags | string[] | Tag vocabulary (data owner) |
| columnTagOverrides | (assetId:columnId) → tags[] | Per-column tags |

**Resolved behavior:**
- **Product for an asset:** `assetDataProductOverrides[assetId] ?? asset.dataProductId` (mock).
- **Terms for a column:** Merge `Column.glossaryTermIds` with `columnTermLinks` for that (assetId, columnId).
- **Tags for a column:** `columnTagOverrides[assetId:columnId] ?? Column.tags` (Tags tab + Schema tab).

---

## 4. Feature → model mapping

| Feature | Entities / state used |
|---------|------------------------|
| Application inventory | Application, DataAsset (applicationId, zone, platform) |
| Medallion view | DataAsset.zone, DataAsset.applicationId, filter/group |
| Data contracts | DataContract, ContractAttribute, ContractSLA, DQRule, versionHistory |
| Contract onboarding | DataContract (requestedByApplicationId, approvedByApplicationId, status) |
| Data products | DataProduct, outputPortAssetIds, assetDataProductOverrides |
| Glossary terms | Glossary, GlossaryTerm; create term → glossaryTerms |
| Column–term linking | ColumnTermLink; Column.glossaryTermIds (legacy); term picker by glossary (optgroup by glossaryId) |
| Fuzzy term recommendations | GlossaryTerm (name, synonyms, definition, tags) → score vs Column name/description |
| Tag management | customTags, columnTagOverrides, Column.tags |
| Catalog / search filters | Domain, Subdomain, Application, platform, zone |

---

## 5. IDs and keys

- **ColumnTagKey:** `"assetId:columnId"` for `columnTagOverrides` and `setColumnTags`.
- **ColumnTermLink:** `(assetId, columnId, termId)`; composite key for add/remove.

Use `columnTagKey(assetId, columnId)` from `src/data/model.ts` when reading/writing column tags.
