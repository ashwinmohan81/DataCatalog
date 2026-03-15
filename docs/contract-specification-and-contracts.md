# Contract Specification and Data Contracts – Requirements

**Audience:** Designer agent and implementers.  
**Scope:** Define **Contract Specification** (producer view) and **Data Contract** (consumer view) with a 1:N relationship, inheritance rules (SLAs from spec; consumer selects attributes only), and the **Contract** tab organized by Data Product and Data Asset showing the specification and linked consumer contracts.

---

## 1. Scope and definitions

- **Contract Specification (producer view):** The producer’s offer for a data asset. It defines: the SLAs the producer promises, the full schema (all attributes offered), and the DQ checks on the asset. One per data asset (or per product+asset). Versioned. In the UI, producer-facing screens use the label **“Contract specification”** (not “Contract”).
- **Data Contract (consumer view):** A consumer’s onboarding instance. It is tied to exactly one Contract Specification. The contract inherits SLAs from the specification (read-only; consumer cannot change them). The consumer selects a **subset** of the specification’s schema attributes. The contract includes producer DQ (opt-in) and optional consumer-side DQ. **One contract per consumer;** each onboarding request creates a new contract linked to the same specification.
- **Design principle:** Producer owns the specification (what is offered). Consumers get individual contracts (what they consume) that reference the specification and only customize attribute selection and DQ opt-in/consumer DQ.

---

## 2. Data model (for designer / implementer)

### 2.1 Contract Specification

- **Entity:** `ContractSpecification` (or equivalent).
- **Fields:** id, assetId, dataProductId? (optional), name, version, createdAt, createdBy, status? (e.g. draft | published), schema (full list of ContractAttribute – all attributes the producer offers), slas, dqRuleIds (producer DQ rules on the asset), versionHistory.
- **Cardinality:** One specification per asset for MVP. Optionally one per (data product, asset) if multiple specs per asset are allowed later.
- **Storage:** Mock: e.g. `contractSpecifications` array; runtime: store or API.

### 2.2 Data Contract (extended)

- **Link to specification:** Add **specificationId** (required when created via consumer request). Every consumer-created contract references one Contract Specification.
- **SLAs:** Do **not** store on the contract. SLAs are always read from the linked Contract Specification. Consumer cannot change SLAs.
- **Schema:** The contract stores only the **consumer-selected subset** of attributes (ids/names from the spec’s schema). Consumer chooses which attributes to consume; the rest are not stored on the contract.
- **Producer DQ:** The specification holds dqRuleIds (producer’s rules on the asset). The contract holds dqRuleIds as the **consumer’s opt-in** (subset of the spec’s rules).
- **Consumer DQ:** The contract holds consumerDqRules (additional checks the consumer will run at their end). Unchanged from current model.
- **Other:** Keep requestedByApplicationId, consumerUseCase, status, approvedByApplicationId, versionHistory, etc. assetId can be derived from the specification or stored for convenience.

---

## 3. Inheritance and rules

- **SLAs:** Contract does not store slas; they are always read from the linked Contract Specification. Consumer cannot change SLAs. Display “SLAs (from specification)” or similar on contract detail.
- **Schema:** Specification holds the full schema (all attributes producer offers). Contract holds only the subset the consumer selected (from that schema). Consumer request flow: show spec’s schema; consumer selects attributes; save only selected attributes on the contract.
- **Producer DQ:** Specification references dqRuleIds (producer’s rules on the asset). Contract stores dqRuleIds as consumer’s opt-in (subset of spec’s rules) plus consumerDqRules for consumer-added checks.

---

## 4. Producer flow

- Producer creates/edits **Contract Specification** for an asset (from asset detail or Contract tab). Defines: name, full schema (from asset columns), SLAs, producer DQ rules (from asset). Use the term **“Contract specification”** on producer screens (not “Contract”).
- One specification per asset for MVP. Actions: “Create specification” (if none), “Edit specification” (producer only). Version when the producer updates the spec.

---

## 5. Consumer flow

- Consumer requests onboarding: selects Data Product then Data Asset (as today). System resolves the **Contract Specification** for that asset. If none exists, consumer cannot request (or show message “No contract specification published for this asset”).
- Creating the request creates a **Data Contract** with specificationId = that spec’s id. Consumer cannot edit SLAs (inherited from spec; display as read-only). Consumer selects which schema attributes to consume (subset of spec’s schema). Consumer opts into producer DQ and can add consumer-side DQ and intended use. Contract stores only selected attributes, opt-in dqRuleIds, consumerDqRules, consumerUseCase, requestedByApplicationId.

---

## 6. Contract tab (by Data Product, Data Asset)

### 6.1 Placement

- Under **Asset detail** and/or **Data Product detail**. Tab label: **“Contract”** or **“Contracts”** (plural).
- Tab visible when the asset has or can have a specification (e.g. asset is in a data product). Optionally a dedicated Contracts view: filter by Data Product and/or Data Asset, then show specification and contracts for the selected asset.

### 6.2 Content

- **Producer view – Contract Specification:** Show the single Contract Specification for this asset: name, version, SLAs, full schema, producer DQ rules. Actions: Create specification (if none), Edit specification (producer only).
- **Linked Data Contracts:** List all Data Contracts where specificationId = this specification (all consumers that onboarded). For each: consumer app (requestedByApplicationId), status, link to full contract detail, approved/rejected date.

### 6.3 Navigation

- From Data Product: drill to an asset, then open Contract tab for that asset (specification + linked contracts).
- From Asset detail: Contract tab shows specification for this asset and list of linked consumer contracts.

---

## 7. Acceptance criteria

- **AC1:** Producer can create/edit one Contract Specification per asset (SLAs, full schema, producer DQ). UI uses “Contract specification” on producer screens.
- **AC2:** Consumer request creates a Data Contract linked to the specification; consumer selects only schema attributes (subset); SLAs are read-only from spec.
- **AC3:** Contract tab (by Data Product / Data Asset) shows the specification and the list of linked consumer contracts.
- **AC4:** One consumer per contract; each new onboarding request creates a new contract tied to the same specification.

---

## 8. Out of scope / mock behavior

- **Amendments:** Specification version bumps and downstream contract behavior (e.g. re-approval when spec schema changes) can be deferred or simplified in mock. Contracts reference spec id and display current spec’s SLAs/schema for display.
- **Execution:** As with the rest of the catalog, execution is mock (no real enforcement of SLAs or DQ).
