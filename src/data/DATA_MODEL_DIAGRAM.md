# Data Catalog — Model (visual)

Render this in any [Mermaid](https://mermaid.js.org/) viewer (e.g. GitHub, VS Code Mermaid extension, [mermaid.live](https://mermaid.live)).

---

## Core catalog (entities & relationships)

```mermaid
erDiagram
  Domain ||--o{ Subdomain : "contains"
  Subdomain ||--o{ DataProduct : "contains"
  DataProduct ||--o{ DataAsset : "data assets"
  DataAsset ||--o{ Column : "has"
  DataAsset }o--|| Application : "owned by (producer)"
  DataAsset }o--o| Connector : "scanned by"
  DataAsset ||--o| DataContract : "has contract"
  DataContract ||--o{ ContractAttribute : "schema"
  DataContract }o--o{ DQRule : "references"
  DQRule }o--|| DataAsset : "on asset"
  Application }o--o{ DataProduct : "consumes"
  Glossary ||--o{ GlossaryTerm : "contains"
  Column }o--o{ GlossaryTerm : "linked via ColumnTermLink"

  Domain {
    string id PK
    string name
    string description
  }

  Subdomain {
    string id PK
    string name
    string domainId FK
  }

  DataProduct {
    string id PK
    string name
    string subdomainId FK
    string domainId FK
    string[] outputPortAssetIds
  }

  DataAsset {
    string id PK
    string name
    string applicationId FK
    string domainId FK
    string subdomainId FK
    string dataProductId FK
    string zone "raw|enriched|conformed"
    string platform "postgres|s3|kafka|..."
    string contractId FK
  }

  Column {
    string id PK
    string name
    string type
    string[] glossaryTermIds
    string[] tags
  }

  Application {
    string id PK
    string name
    string type "producer|consumer"
    string[] consumedDataProductIds
  }

  Connector {
    string id PK
    string name
    string type
  }

  DataContract {
    string id PK
    string assetId FK
    string requestedByApplicationId FK
    string approvedByApplicationId FK
    string status "draft|pending_approval|approved|rejected"
    ContractSLA[] slas
    string[] dqRuleIds
  }

  ContractAttribute {
    string id PK
    string name
    string type
    string glossaryTermId FK
  }

  DQRule {
    string id PK
    string assetId FK
    string columnId FK
    string type "null_check|uniqueness|..."
  }

  Glossary {
    string id PK
    string name
  }

  GlossaryTerm {
    string id PK
    string glossaryId FK
    string name
    string definition
    string[] synonyms
  }
```

---

## Simplified view (for slides)

High-level flow: **Domain → Subdomain → Data Product → Assets → Columns**; **Glossary → Terms** linked to columns; **Contracts** and **Applications** tie to assets.

```mermaid
flowchart LR
  subgraph Governance
    G[Glossary]
    T[Terms]
    G --> T
  end

  subgraph Catalog
    D[Domain]
    S[Subdomain]
    DP[Data Product]
    A[Data Asset]
    C[Column]
    D --> S --> DP
    DP --> A --> C
  end

  subgraph Contracts
    DC[Data Contract]
    DQ[DQ Rules]
    DC --> DQ
  end

  A -.->|"contract"| DC
  App[Application] -.->|"owns"| A
  App -.->|"consumes"| DP
  T <-.->|"link"| C
```

---

## Runtime overlay (in-memory state)

User-created or override data that sits on top of the core catalog:

```mermaid
flowchart TB
  subgraph Core["Core catalog (mock/backend)"]
    Assets[DataAsset]
    Products[DataProduct]
    Terms[GlossaryTerm]
  end

  subgraph Runtime["Runtime overlay (store)"]
    CR[Contract requests]
    RP[Runtime data products]
    OV[Asset → Product overrides]
    RT[Runtime terms]
    CTL[Column–Term links]
    TAG[Custom tags]
    CTO[Column tag overrides]
  end

  CR -->|"extends"| Contracts[DataContract]
  RP --> Products
  OV -->|"override product for asset"| Assets
  RT --> Terms
  CTL -->|"link column to term"| Terms
  CTL --> Assets
  TAG --> CTO
  CTO -->|"tags per column"| Assets
```

---

*Generated from `src/data/model.ts` and `src/data/DATA_MODEL.md`.*
