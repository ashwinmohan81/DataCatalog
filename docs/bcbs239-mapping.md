# BCBS 239 – Principle to Catalog Capability Mapping

BCBS 239: *Principles for Effective Risk Data Aggregation and Risk Reporting.*  
This document maps each principle area to catalog capabilities for compliance evidence and UI (e.g. Compliance dashboard).

---

## Section I – Governance

| Principle | Catalog capability | Evidence / UI placeholder |
|-----------|--------------------|---------------------------|
| **Governance** – Board and senior management oversight of risk data | Ownership and stewardship in catalog; workflows for change and approval | Glossary owner/steward; Data owner on assets; Workflow tasks; “Governance” view |
| **Data architecture & IT infrastructure** – Architecture supports aggregation and reporting | Lineage, logical/physical mapping, single place to discover risk data | Lineage tab; Logical model mapping; Domain/Data product hierarchy; “Data architecture” filter |

---

## Section II – Risk Data Aggregation Capabilities

| Principle | Catalog capability | Evidence / UI placeholder |
|-----------|--------------------|---------------------------|
| **Accuracy & integrity** – Largely automated, minimal manual error | DQ rules, profiling, versioning | DQ rules and run history; Profile stats; Asset versions; “Accuracy” in Compliance |
| **Completeness** – All material risk data (by line, entity, region, etc.) | Domains, data products, coverage and tagging | Domain/Subdomain/Data product; Tags (e.g. business line, region); Coverage/Insights (glossary maturity, asset count) |
| **Timeliness** – Data available when needed | Last scan time, refresh metadata | Last scan on asset; Connector schedule; “Timeliness” in Compliance |
| **Adaptability** – Able to adapt to changing requirements | Versioning, change tracking, workflows | Asset versions; Change requests; Audit log; “Adaptability” in Compliance |

---

## Section III – Risk Reporting Practices

| Principle | Catalog capability | Evidence / UI placeholder |
|-----------|--------------------|---------------------------|
| **Accuracy** – Reports accurate and reliable | Same as aggregation (DQ, lineage, ownership) | Link to DQ and lineage from “Reporting” |
| **Comprehensiveness** – Reports cover all material risk | Coverage by domain/data product; “BCBS 239 relevant” filter | Compliance dashboard: coverage by domain; Filter “Regulatory / BCBS” |
| **Clarity & usefulness** – Reports clear and useful to recipients | Glossary, definitions, data contract semantics | Glossary terms; Contract schema/semantics; “Clarity” = glossary coverage |
| **Frequency & distribution** – Appropriate frequency and distribution | Metadata on refresh/SLA; optional “report” definition in catalog | SLA on data product; Last scan; “Export for compliance” (mock report) |

---

## Section IV – Supervisory Review

| Principle | Catalog capability | Evidence / UI placeholder |
|-----------|--------------------|---------------------------|
| **Supervisory review** – Supervisors assess compliance | Export and evidence package | “Export for compliance” action; Compliance dashboard with links to lineage, DQ, glossary, ownership |

---

## Section V – Supervisory Cooperation

| Principle | Catalog capability | Evidence / UI placeholder |
|-----------|--------------------|---------------------------|
| **Cooperation** – Cross-border cooperation | (Organizational; catalog can tag jurisdiction/entity) | Tags for legal entity / region; Filter by entity/region for export |

---

## Compliance Dashboard (UI)

- **Principles list:** Show the 14 principles or 5 sections with status (e.g. “Supported” / “Evidence available”).
- **Per principle:** Link to catalog capability (e.g. “Lineage” → Lineage tab; “Governance” → Glossary + Owners).
- **Export for compliance:** Button that generates (mock) package: snapshot of lineage, DQ summary, glossary coverage, ownership, and last scan dates for “BCBS 239 relevant” assets.

---

## “BCBS 239 Relevant” Filter

- **Meaning:** Assets or data products tagged for risk reporting (e.g. tag “BCBS 239” or “Risk data”).
- **Use:** In search, browse, and Compliance view, user can filter to only these assets so evidence and export are scoped.
