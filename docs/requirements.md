# Data Catalog & Marketplace – Product Requirements

**Version:** 1.0  
**Scope:** Single unified application (Catalog + Marketplace). No UI decisions in this document; Designer Agent consumes this for design and mock data.

---

## 1. Discovery & Search

### 1.1 Easy Search
- **Global search bar** with instant (type-ahead) results.
- **Result types:** Data assets, glossary terms, data products. Each result type clearly labeled.
- **Faceted filters** (apply to search and browse):
  - Domain, Subdomain, Data Product
  - Asset type: Table, File, API, Dashboard, Pipeline
  - Zone (raw, enriched, conformed)
  - Application (producer application that owns the asset)
  - Owner (person/team)
  - Tags (multi-select)
  - Certification status (e.g. Certified / Uncertified)
- **Acceptance:** User can search by keyword and narrow results using the above filters. Results update in real time as filters change.

### 1.2 Discoverability
- **Browse by hierarchy:** Domain → Subdomain → Data Product. Click-through to see assets under each.
- **Featured section:** Curated “Featured” data products or assets on home/discovery.
- **Recently used:** User-specific “Recently used” assets/products.
- **Related assets:** On asset detail, show “Related” or “Consumers also viewed.”
- **Acceptance:** User can discover assets without knowing exact names by browsing domains and by featured/recent sections.

### 1.3 Search entry point and navigation
- **No dedicated Search tab:** "Search" is not a top-level navigation item. Search is triggered only from the **global search bar** in the header (existing §1.1 behavior).
- **Submit behavior:** When the user submits the search bar:
  - **Option A (recommended for consistency):** Navigate to a **search results page** (e.g. `/search?q=...`) that shows unified results (assets, glossary terms, data products) with faceted filters. The results page is reachable only via the bar or direct URL, not via a nav link.
  - **Option B:** Navigate to **Catalog** (or Marketplace) with a query parameter (e.g. `/catalog?q=...`) and show filtered results there; no dedicated search results page.
- **Acceptance criteria:** (1) Top-level nav does not include "Search". (2) User can search by entering text in the global bar and submitting. (3) Results are shown per the chosen option (dedicated page or Catalog/Marketplace with query). (4) Faceted filters (zone, application, platform, etc.) continue to apply as in §1.1.

### 1.4 Text-to-metadata (natural language) discovery
- **Purpose:** Allow users to describe what they need in natural language (e.g. "tables with customer credit exposure for risk reporting") and receive data assets (and optionally glossary terms and data products) that match that description.
- **Entry point:** A dedicated experience — either a dedicated page (e.g. "Find by description" or "Natural language search") reachable from nav or from the search bar (e.g. "Describe what you need" link/mode), or an optional mode on the same search results page. No requirement to replace keyword search; this can coexist.
- **User flow:** (1) User sees a text area or input. (2) User types one or more sentences in English. (3) User triggers search (button or submit). (4) System interprets the text and returns a set of matching data assets (and optionally glossary terms, data products) with brief context (e.g. why the asset matched). (5) User can refine or filter results using existing facets.
- **Mock behavior (no real NLP):** For the mock or MVP, interpretation is best-effort without a semantic backend:
  - **Keyword extraction:** Split the input into significant words (e.g. drop stopwords), match against asset name, displayName, description, tags, domain/subdomain/product names, and glossary term name/definition.
  - **Optional phrase-to-metadata map:** A small set of example phrases or concepts mapped to metadata (e.g. "credit exposure" or "risk reporting" → domain Risk, tags such as "BCBS 239", "exposure"). Use these to boost or filter results (e.g. restrict to domain + keyword match).
  - Results are presented in the same result-type sections as keyword search (assets, terms, products) with optional short "matched because" hints (e.g. "Matched: domain Risk, tag exposure").
- **Future (real implementation):** A later phase may use embeddings, an LLM, or a semantic layer to map natural language to concepts/metadata and to asset IDs; the UX (describe need → see assets) remains the same.
- **Acceptance criteria:** (1) User can enter free-form English in a dedicated "text to metadata" entry point. (2) Submitting returns data assets (and optionally terms/products) that match the description. (3) In the mock, matching is based on keyword extraction and/or a configurable phrase-to-metadata mapping. (4) Results are clearly labeled by type (asset / term / product) and optionally show why they matched. (5) Existing faceted filters can be applied to narrow results.

---

## 2. Personas & Customizable Views

### 2.1 Personas
- **Data Consumer (business):** Focus on discovery, marketplace, data contracts, and consumption. Default view: Marketplace and certified data products.
- **Data Steward:** Focus on glossary, tagging, quality, and mappings. Default view: Governance and quality dashboards.
- **Data Owner:** Focus on assets they own, change requests, and contracts they publish. Default view: My assets and tasks.
- **Data Engineer:** Focus on connectors, lineage, schema, and pipelines. Default view: Catalog and lineage.
- **Regulator:** Focus on compliance, lineage, and evidence. Default view: Compliance dashboard and lineage; read-only emphasis.
- **Acceptance:** Application supports switching persona; home/default navigation and default filters reflect the selected persona (see `docs/personas.md` for defaults).

### 2.2 Customizable Views
- **Saved filter sets:** User can save current filter combination (e.g. “Risk domain, certified only”) and name it; can restore later.
- **Default columns:** Per asset type, user can choose which columns appear in list/table view (e.g. Owner, Last scan, Certification).
- **Layout:** List view vs card view vs table view for asset/product lists.
- **Optional:** “My workspace” or pinned items (favorite assets/products).
- **Acceptance:** User can personalize discovery and list views as above; preferences persist in session or mock storage.

---

## 3. Collaboration

### 3.1 Chat
- **Contextual chat** on a data asset or data product. One thread per asset/product.
- **Optional:** “Ask about this dataset” for discovery (e.g. natural language question).
- **Acceptance:** User can open a chat panel from asset/product detail and see a thread (mock messages ok).

### 3.2 Notifications
- **In-app notification bell** with list of recent notifications.
- **Notification types:** Change request assigned, DQ failure, contract approval/request, workflow task update.
- **Optional:** Digest (e.g. daily summary).
- **Acceptance:** User sees a bell icon; clicking shows notifications (mock). Notifications are tied to workflows and DQ where applicable.

---

## 4. Data Mesh Compliance

### 4.1 Hierarchy
- **Domain:** Top-level business area (e.g. Risk, Customer, Finance, Operations).
- **Subdomain:** Child of domain (e.g. Credit Risk, Market Risk under Risk).
- **Data Product:** Curated product under a domain/subdomain. Has:
  - Output ports (published data assets)
  - Owner (person/team)
  - SLA (optional)
  - Optional data contract
- **Acceptance:** Catalog exposes Domain → Subdomain → Data Product in navigation and filters. Every asset can be associated with a data product.

### 4.2 Asset-Level Data Mesh
- **Belongs to data product:** Each asset can be linked to one data product.
- **Output port flag:** For assets that are published for consumption (part of a data product’s output).
- **Acceptance:** Asset detail and list show data product and “output port” where applicable. Filtering by data product returns only relevant assets.

### 4.3 Application (producer / consumer)

- **Producer application:** A logical “producer app” that owns a set of data assets (physical inventory). User can search for the application by name and list all assets that belong to it. Attributes: id, name, description, owner, type = producer; optional link to connector(s) or source system for context.
- **Consumer application:** A logical “consumer app” that consumes data from producer(s). Can link to data products or contracts it consumes (for discovery and impact). Attributes: id, name, description, owner, type = consumer; optional list of consumed data product IDs or contract IDs.
- **Acceptance:** Catalog supports applications as first-class entities. User can browse or search applications, open a producer application to see its full physical inventory; open a consumer to see what it consumes.

### 4.4 Zone (raw / enriched / conformed)

- **Zone on assets:** Every data asset can be tagged with exactly one zone: **raw**, **enriched**, or **conformed** (or “unset” if not applicable). Zone may align with schema name, bucket name, or explicit tagging.
- **Optional container:** Optionally, a container (e.g. database schema or bucket) can have a zone; assets under that container inherit the zone for display/filtering. For the mockup, per-asset zone is sufficient; container can be a later enhancement.
- **Acceptance:** User can filter and group assets by zone. “Medallion view” (see below) represents these zones as distinct layers.

### 4.5 Application-centric inventory view

- **Entry:** A dedicated view (e.g. “Inventory” or “Applications” in the nav) that lists applications (producers and consumers). Filter by type (producer / consumer).
- **Producer drill-down:** Selecting a producer application shows its **physical inventory**: all data assets belonging to that application. List/table with columns: asset name, type, zone, connector, last scan, owner. Optional grouping by zone (raw → enriched → conformed) within the inventory.
- **Consumer drill-down:** Selecting a consumer application shows consumed data products/contracts and optionally source producers.
- **Acceptance:** User can go to Inventory → pick an application → see all its assets (if producer) or consumed products (if consumer), with zone visible and filterable.

### 4.6 Medallion (zone) view

- **Purpose:** When the user wants a “medallion view,” the catalog presents assets grouped by zone: Raw → Enriched → Conformed (left to right or top to bottom). Can be scoped to “all assets” or “within this application.”
- **Behavior:** Three sections (or columns): Raw zone assets, Enriched zone assets, Conformed zone assets. Each section lists assets with key metadata; clicking an asset opens asset detail. Empty zones are still shown (e.g. “No assets in Enriched”).
- **Acceptance:** User can open a Medallion view (global or per-application) and see assets grouped by zone with clear visual separation of layers.

---

## 5. Connectors & Ingestion

### 5.1 Connectors
- **Connector types:** Snowflake, BigQuery, S3, Kafka, relational DBs (e.g. PostgreSQL, MySQL), and similar. List is configurable.
- **Add connection:** Flow to add a new connection (name, type, config placeholders). No real credentials in mock.
- **Schedule scan:** Ability to set schedule (e.g. daily) for metadata/profile scan.
- **Acceptance:** User can see list of connectors, “Add connection,” and schedule scan (mock; no real execution).

### 5.2 Scan Outcomes
- **Profile stats:** Row count, distinct count, null count, min/max for applicable columns.
- **Auto-classification:** PII tags, domain-specific tags applied by “scanner” (mock).
- **Schema sync:** Optional sync of schema (add/remove columns) from source.
- **Last scan time:** Display on asset detail and in lists.
- **Acceptance:** Asset detail shows profile summary (e.g. row count, sample column stats), last scan time, and any auto-applied tags.

---

## 6. Governance: Business Glossary & Associations

### 6.1 Business Glossary
- **Terms:** Name, definition, synonyms, owner, steward.
- **Link to:** Data contract attributes, logical model attributes.
- **Acceptance:** Glossary has term list and term detail (definition, synonyms, owner, steward). Term can be linked to asset columns and logical attributes.

### 6.2 Associations
- **Glossary term ↔ asset column:** Many-to-many. A column can map to one or more terms; a term can map to many columns.
- **Glossary term ↔ logical attribute:** For logical model mapping.
- **Maturity:** Mapped / Partially mapped / Unmapped (used in insights).
- **Acceptance:** Asset column detail shows linked glossary terms. Glossary term detail shows linked columns/assets. Maturity is derivable (e.g. % columns mapped per asset/domain).

---

## 7. Custom Tags

- **Levels:** Tags can be applied to (a) data assets (table and optionally column), (b) glossary terms, (c) data products.
- **Tag management:** Create tag, optional merge, optional hierarchy (e.g. parent/child tags).
- **Filter and search:** Filter assets/products/glossary by one or more tags; search can include tag names.
- **Acceptance:** User can add/remove tags on assets, terms, and data products. Filter panel includes tags. Tag management UI allows create (and optional merge/hierarchy in mock).

---

## 8. Workflows

### 8.1 Change Request → Data Owner Task
- **Request change** on an asset (e.g. add column, fix definition, add term). Creates a **task** assigned to the data owner.
- **Task status:** Open / In progress / Done.
- **Notifications:** Data owner notified on assignment; requester notified on completion (mock).
- **Acceptance:** User can submit a change request from asset detail. Task appears in “Workflows” or “My tasks.” Data owner can see tasks assigned to them and update status.

---

## 9. Logical Data Models & Physical Mapping

### 9.1 Logical Data Models
- **Stored entities and attributes:** e.g. Customer, Order with attributes. Relationships between entities (e.g. Order → Customer).
- **Acceptance:** Catalog can store and display logical models (entity-relationship). Shown in a dedicated area (e.g. Governance or Model view).

### 9.2 Auto-Mapping to Physical
- **Suggest mapping:** System suggests physical column ↔ logical attribute (e.g. by name/similarity).
- **Steward actions:** Steward can confirm or reject suggested mappings.
- **Display:** Asset detail and lineage show “logical ↔ physical” where mapped.
- **Acceptance:** User sees suggested mappings on asset/column; can confirm/reject. Asset detail shows logical attribute(s) for each column when mapped.

---

## 10. Lineage

- **Column-level lineage:** Graph showing how a column flows across applications/systems (upstream and downstream).
- **Filter:** By application, domain, or data product.
- **Impact analysis:** View of “what uses this column” (downstream).
- **Acceptance:** Asset/column detail has a Lineage tab with a graph (nodes = systems/processes, edges = column flow). Filter and impact view supported in mock.

---

## 11. Data Contract Journey

### 11.1 Producer
- **Create/publish** data contract specification on a distribution (publishable) data asset.
- **Contract content:** Schema, semantics, SLO, optional quality rules. Versioned.
- **Acceptance:** Producer can create/edit contract from asset detail; contract has version; list of contracts per asset.

### 11.2 Consumer
- **Discover** contract on asset (e.g. “Data contract” tab or Marketplace).
- **Consume flow:** Select required attributes from contract, request access if needed, get contract snapshot for their use.
- **Acceptance:** Consumer sees contract; “Consume” opens attribute picker; can request access (mock); can “get snapshot” (mock download or copy).

---

## 12. Data Quality (Self-Service)

### 12.1 DQ Rules
- **Prebuilt rules:** Null check, uniqueness, range, regex (and similar).
- **Custom SQL rules:** User-defined SQL executed against target (table/column). Mock: no real execution; show rule definition and sample results.
- **Target:** Data asset (table or column).
- **Schedule or on-demand:** User can run rules on schedule or ad hoc.
- **Acceptance:** User can add prebuilt or custom SQL rule to an asset; see rule list per asset; run (mock) and see run history.

### 12.2 Execution & Results
- **Run history:** List of runs with timestamp, pass/fail, rule name.
- **Sample failures:** For failed rules, show sample failing rows or count (mock).
- **Results feed insights:** DQ results are used in Insights (asset health, pass rate).

### 12.3 DQ dimensions (categorization and reporting)
- **Dimensions:** Every DQ rule is categorized into one of: Correctness, Completeness, Timeliness, Uniqueness, Validity, Consistency. See `docs/dq-dimensions.md` for definitions and rule–dimension mapping.
- **Reporting:** Insights report DQ by these dimensions (KPIs, charts, tables). Data product and asset DQ views show per-dimension breakdown where applicable.
- **Acceptance:** All rules have a dimension (stored or derived). Insights show DQ breakdown by DQ dimension. Data product summary and asset DQ tab expose dimension-level metrics. Data Quality page supports filter and display by dimension.

---

## 13. Insights

### 13.1 DQ-Based
- **Asset health score:** Derived from rule pass rate (e.g. 0–100).
- **Rule pass rate:** Per asset and aggregate.
- **Trend:** Pass rate over time (mock time series).
- **Drill-down:** From dashboard to failed rules and to asset detail.
- **Acceptance:** Insights dashboard shows DQ summary (health score, pass rate, trend). User can drill to assets and failed rules.

### 13.2 Glossary Mapping Maturity
- **Metric:** % of columns mapped to glossary by domain and by data product.
- **Gaps and recommendations:** e.g. “Asset X has 30% columns unmapped.”
- **Acceptance:** Insights dashboard or Governance shows maturity by domain/data product; list of assets with low maturity.

---

## 14. Versioning & Change Tracking

### 14.1 Asset Versions
- **Track changes:** Schema and metadata over time (add/remove columns, profile history).
- **Version selector:** On asset detail and in lineage, user can select a point-in-time version.
- **Acceptance:** Asset detail has “Versions” tab with version list (e.g. v3 – column added; v2 – definition updated). Lineage can show version if applicable.

### 14.2 Audit
- **Who changed what and when:** For BCBS and general governance. Log of changes (asset, column, glossary, etc.) with user and timestamp.
- **Acceptance:** Audit log view or export (mock) showing change events.

---

## 15. Regulatory (BCBS 239 and Similar)

- **Governance:** Glossary, ownership, stewardship, and workflows support governance principle.
- **Data architecture:** Lineage, logical/physical mapping, and tagging/domain support single view of risk data and architecture.
- **Accuracy/integrity:** DQ rules, profiling, and versioning support data accuracy and integrity.
- **Completeness:** Domains, data products, and coverage reports support completeness.
- **Timeliness:** Last scan time and refresh metadata support timeliness.
- **Reporting:** Export or snapshot for supervisory use (mock: “Export for compliance” action).
- **UI:** Compliance dashboard or filter (e.g. “BCBS 239 relevant”) and evidence placeholders (lineage, DQ, glossary coverage). See `docs/bcbs239-mapping.md` for principle-to-capability mapping.
- **Acceptance:** User can open Compliance view and see principles mapped to catalog capabilities; can trigger “Export for compliance” (mock).

---

## 16. Modern Catalog Features (To Incorporate)

- **Semantic/NLP search:** Search that understands intent (mock: keyword + facets; real implementation would use NLP). See §1.4 for the text-to-metadata (natural language) discovery experience.
- **Domain-based discovery:** Browse and filter by domain/subdomain/data product as first-class.
- **Federated governance:** Domain-level ownership with central glossary and policy placeholders.
- **Self-service access workflows:** Change request and access request flows (mock).
- **Attribute-based access:** Placeholder for “sensitive” or “restricted” tags that would drive access (mock).
- **Column-level lineage:** As in §10.
- **Marketplace as showroom:** Marketplace view = curated, consumer-oriented slice of catalog (certified data products, contracts).

---

## 17. Out of Scope for Mockup

- Real authentication/authorization.
- Real connector execution or live scans.
- Real DQ execution or SQL run.
- Real chat backend or NLP.
- Persistent database; mock data is client-side only.

**Note:** Text-to-metadata discovery (§1.4) is in scope as a UX and mock (keyword/phrase-based) behavior; only a real NLP/LLM backend is out of scope for the mock.
