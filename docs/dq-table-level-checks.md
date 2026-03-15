# Table/Entity-Level Data Quality Checks – Requirements

**Audience:** Designer agent and implementers.  
**Scope:** Extend DQ so that **table/entity-level checks** are first-class alongside **column-level checks**. Same DQ dimensions and reporting apply; distinction is the **scope** of the rule (column vs table).

---

## 1. Scope and definitions

- **Column-level check (current):** Rule targets a single column of an asset (e.g. "exposure_amount not null", "exposure_id unique"). Implemented via `DQRule` with `columnId` set and templates with `columnRequired: true`.
- **Table/entity-level check:** Rule targets the asset (table/entity) as a whole, not a specific column. Examples: row count within expected range, table freshness (last load time), no duplicate rows (composite key), referential integrity with another table, custom SQL that aggregates or compares the whole table.
- **Design principle:** Same DQ dimensions and reporting apply to both levels; the only distinction is the **scope** of the rule (column vs table). Run history, pass/fail, and Insights aggregation treat both uniformly unless the UI explicitly distinguishes them (e.g. filter by level).

---

## 2. Table-level rule types (prebuilt templates)

A small set of table-level template types the catalog supports:

| Type / template idea | Description | Example config | Default dimension |
|----------------------|-------------|----------------|-------------------|
| **Row count (range)** | Fail if table row count is outside [min, max] or below minimum. | minRows?, maxRows? | Completeness or Validity |
| **Freshness** | Fail if table has not been updated within a threshold (e.g. last_updated_at &lt; now - 1 day, or file/sync timestamp). | timestampColumn?, maxAgeHours or schedule | Timeliness |
| **Duplicate rows (composite)** | Fail if there are duplicate rows on a set of columns (composite key). | columns[] | Uniqueness |
| **Row count (expected)** | Fail if row count differs from expected by more than a tolerance (e.g. for daily snapshots). | expectedCount?, tolerancePct? | Completeness / Consistency |
| **Custom SQL (table)** | User-defined SQL that runs at table scope (e.g. returns rows that violate a rule; no single column). Already supported by existing custom_sql template with columnRequired: false. | sql | Correctness (or user-selected) |

**Optional candidates** (designer can defer): referential integrity (rows in table A must have matching key in table B), schema/column existence checks. Keep the initial set small for a clear MVP.

---

## 3. Data model (for designer / implementer)

- **Rule scope:** A rule is **column-level** if it has a `columnId` (and targets one column); **table-level** if it has no `columnId`. Existing `DQRule` already has `columnId?: string` and `assetId: string`, so table-level rules are representable by omitting `columnId`.
- **Templates:** A template has `columnRequired: boolean`. When `columnRequired` is false, the rule is table-level (no column selector in UI; config may include table-scoped parameters such as minRows, maxRows, timestampColumn, columns[] for composite uniqueness, or sql).
- **Reporting and aggregation:** Table-level and column-level rules are aggregated together for asset and data-product DQ score and for dimension-level reporting (no separate "table score" unless product explicitly asks for it). **Optional:** Allow filtering or grouping rules by "Column" vs "Table" in rule lists and in Insights.

---

## 4. UI requirements (for designer agent)

### 4.1 Add rule (asset DQ tab)

- When the user selects a **column-level** template (`columnRequired: true`), show the existing column dropdown and column-specific config; rule is created with `columnId` set.
- When the user selects a **table-level** template (`columnRequired: false`), do **not** show the column selector; show table-level config fields (e.g. min rows, max rows, freshness column + threshold, or composite key columns). Rule is created with no `columnId`.
- Custom SQL can remain a single template that supports both: if user leaves "column" empty or template is table-scoped, treat as table-level.

### 4.2 Rule list (asset DQ tab, Data Quality page)

- Show scope of each rule: e.g. column name for column-level, "Table" or "Entity" for table-level. Optionally a badge or column "Level" with values "Column" / "Table".
- **Filter (e.g. on Data Quality page):** Allow filter by "Level" (Column / Table) in addition to existing DQ dimension filter.

### 4.3 Run history

- For table-level rules, "Column" or equivalent can show "—" or "Table". Sample failures (if any) may reference row identifiers or keys rather than a single column.

### 4.4 Contract / data product

- Table-level rules can be attached to contracts and data products the same way as column-level rules (by rule id); no special handling required unless product wants to distinguish in contract schema or SLA display.

---

## 5. Reporting and insights

- Table-level rules are included in:
  - Asset DQ summary (pass/fail count, score)
  - Data product DQ summary and per-dimension breakdown
  - Insights: DQ by dimension, DQ health by domain/tier, etc.
- **Optional:** In Insights or Data Quality page, a breakdown or filter by **rule level** (column vs table) so stewards can see how many table-level vs column-level rules exist and their pass rates.

---

## 6. Acceptance criteria

- **AC1:** User can create a table-level DQ rule on an asset (via a template that does not require a column). Rule is stored with `assetId` and no `columnId`.
- **AC2:** User can create at least two distinct table-level rule types from prebuilt templates (e.g. row count range, freshness). Config is table-scoped (no column picker).
- **AC3:** Rule list and run history clearly indicate whether each rule is column-level or table-level (e.g. "Column: exposure_amount" vs "Table").
- **AC4:** Table-level rules contribute to asset and data product DQ score and to dimension-based reporting in Insights.
- **AC5 (optional):** User can filter rules by level (Column / Table) on the Data Quality page and optionally in asset DQ tab.

---

## 7. Out of scope / mock behavior

- **Execution:** As with column-level rules, execution is mock (no real run against a database). Run history and sample failures are mock data.
- **Backend:** Requirements do not assume a specific DQ engine (e.g. Great Expectations); table-level expectations (e.g. `expect_table_row_count_to_be_between`) can be mapped to a future engine.
