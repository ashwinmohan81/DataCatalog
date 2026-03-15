# Personas & Default Views

Used by the Designer Agent to implement persona switcher and default home/navigation per persona.

---

## 1. Data Consumer (Business)

- **Goal:** Find and consume trusted data for reporting and analytics.
- **Default home:** Marketplace (curated data products).
- **Default navigation emphasis:** Marketplace, Discover, Data contracts.
- **Default filters:** Certified assets preferred; by use case or domain.
- **Typical actions:** Search/browse, open data product, view contract, “Consume” (pick attributes, request access).

---

## 2. Data Steward

- **Goal:** Maintain glossary, tags, quality, and mappings.
- **Default home:** Governance dashboard (glossary maturity, recent changes).
- **Default navigation emphasis:** Governance, Glossary, Data quality, Tags.
- **Default filters:** By domain for glossary; by certification for quality.
- **Typical actions:** Edit glossary terms, link terms to columns, add tags, define DQ rules, confirm/reject logical mappings.

---

## 3. Data Owner

- **Goal:** Own assets and data products; respond to change requests and publish contracts.
- **Default home:** My assets & tasks (change requests assigned to me).
- **Default navigation emphasis:** My assets, Workflows (tasks), Data products I own, Contracts.
- **Default filters:** “Owned by me”; tasks “Assigned to me.”
- **Typical actions:** View/complete change request tasks, publish/update data contract, manage data assets.

---

## 4. Data Engineer

- **Goal:** Integrate sources, maintain lineage, and fix schema/issues.
- **Default home:** Catalog browse (domains/assets) or Connectors.
- **Default navigation emphasis:** Catalog, Domains, Connectors, Lineage, Schema/Profile.
- **Default filters:** By connector/source system; by asset type (table, pipeline).
- **Typical actions:** Add connector, run scan, view lineage, inspect schema and profile.

---

## 5. Regulator

- **Goal:** Review compliance evidence and risk data aggregation.
- **Default home:** Compliance dashboard (BCBS 239 or similar).
- **Default navigation emphasis:** Compliance, Lineage, Glossary coverage, Export for compliance.
- **Default filters:** “BCBS 239 relevant”; read-only emphasis; no edit actions.
- **Typical actions:** View principle-to-capability mapping, drill to lineage/DQ/glossary, “Export for compliance.”

---

## Implementation Notes for Designer

- **Persona switcher:** Dropdown or menu in app shell (e.g. next to user avatar) to switch persona. Current persona drives:
  - Default landing page after login or “Home.”
  - Which nav items are prominent (e.g. reorder or highlight).
  - Optional default filter presets (e.g. Regulator: compliance filter on).
- **No real auth:** Mock “current user” and “current persona”; switching persona is just UI state.
- **Same app:** All personas use the same screens; only default view and emphasis change.
