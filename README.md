# Data Catalog & Marketplace Mockup

Unified React mockup for a data catalog and marketplace with requirements from `docs/requirements.md`. Uses mock data only (no backend).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Features (mock)

- **Search** – Global search with filters (assets, glossary, data products). Use `/search?q=exposure`.
- **Catalog** – Browse by domain; asset list with owner, data product, last scan, tags.
- **Marketplace** – Featured data products, recently used, consume contracts.
- **Asset detail** – Tabs: Overview, Schema, Profile, Lineage, Glossary, DQ, Versions, Contract (if any), Activity.
- **Data product detail** – Output ports, contract link.
- **Glossary** – Term list and term detail with linked columns.
- **Data contracts** – List and consume flow (attribute picker, request access).
- **Data quality** – Rules, run history, recent failures.
- **Workflows** – Change request tasks (open / in progress / done).
- **Insights** – DQ health score, glossary maturity by domain.
- **Compliance** – BCBS 239 principle-to-capability mapping, “Export for compliance” placeholder.
- **Connectors** – List of connections, add connection (mock).
- **Governance** – Glossary count, domains, low maturity assets.
- **Persona switcher** – Top-right; switches home (Marketplace / Governance / Workflows / Catalog / Compliance).
- **Notifications** – Bell icon with mock notifications.

## Stack

- React 18, Vite, TypeScript
- React Router, Zustand
- Design tokens in `src/design-system/tokens.css`
- Mock data in `src/data/mock/`

## Docs

- `docs/requirements.md` – Full product requirements
- `docs/personas.md` – Persona definitions and default views
- `docs/bcbs239-mapping.md` – BCBS 239 principle → catalog capability
