# Data Quality Dimensions – Requirements

**Scope:** Categorize DQ rules into standard dimensions (Correctness, Completeness, Timeliness, etc.) and report on DQ by these dimensions across Insights, Data Product, and Asset views.

---

## 1. DQ dimensions (fixed set)

Every DQ rule is assigned exactly one dimension. The catalog supports the following dimensions (aligned with common frameworks such as DMBOK):

| Dimension      | Description |
|----------------|-------------|
| **Correctness** | Values conform to business rules or expected semantics (e.g. cross-field logic, custom business rules). |
| **Completeness** | No missing or disallowed nulls; required fields are populated. |
| **Timeliness**   | Data freshness, SLA adherence, or expected arrival time. |
| **Uniqueness**   | No duplicate values where uniqueness is required (e.g. primary key, natural key). |
| **Validity**     | Format, range, or set membership (e.g. regex, min/max, allowed values). |
| **Consistency**  | Cross-field or cross-asset consistency (e.g. referential alignment, same grain). |

- Dimensions are first-class in the model: each rule has a `dimension` field (or inherits from its template).
- Templates define a default dimension; when creating a rule from a template, the dimension can be overridden if the UI supports it.

---

## 2. Rule–dimension mapping

Default mapping from rule type (implementation) to dimension:

| Rule type   | Default dimension |
|-------------|--------------------|
| `null_check` | Completeness       |
| `uniqueness` | Uniqueness         |
| `range`      | Validity           |
| `regex`      | Validity           |
| Value-in-set | Validity           |
| `custom_sql` | Correctness (user can assign another dimension when creating the rule) |

Timeliness rules are typically custom (e.g. “last_updated_at &gt; now() - 1 day”) and should be created with dimension **Timeliness**.

When a rule has no explicit `dimension`, the system derives it from the rule’s `type` using the above mapping for backward compatibility.

---

## 3. Reporting and UI

### 3.1 Insights

- **Per-dimension KPIs / summary cards:** Pass rate (or RAG status) per DQ dimension for the filtered asset set (e.g. “Completeness: 92%”, “Timeliness: 78%”).
- **Charts:** “DQ health by DQ dimension” (e.g. bar chart: dimension vs pass %). Optional: “DQ pass rate trend by dimension” (e.g. line chart with one series per dimension).
- **Table “DQ results by dimension”:** Rows for each DQ dimension (Correctness, Completeness, Timeliness, Uniqueness, Validity, Consistency) with:
  - Rule count
  - Passed count
  - Pass rate %
  - RAG status (green/amber/red/grey)
  Optionally keep the existing “by Domain / Tier / Asset type” table and add a separate “By DQ dimension” table.

### 3.2 Data product detail

- DQ summary shows overall score plus **per-dimension breakdown** (e.g. Correctness 95%, Completeness 88%, Timeliness —) when rules exist for that dimension. Dimensions with no rules show “—”.

### 3.3 Asset detail (DQ tab)

- List or group rules by DQ dimension.
- Show dimension badge (or column) per rule.

### 3.4 Data Quality page

- **Dimension column** in the “All rules” table.
- **Filter by DQ dimension** (dropdown or facet).
- Optional: group rules by dimension in the list.

---

## 4. Acceptance criteria

- All rules have a dimension (stored explicitly or derived from template/rule type).
- Insights page shows at least one chart or table that breaks down DQ by DQ dimension (Correctness, Completeness, Timeliness, etc.).
- Data product DQ summary and asset DQ section expose dimension-level metrics where applicable.
- Data Quality page allows filtering rules by DQ dimension and displays dimension for each rule.
