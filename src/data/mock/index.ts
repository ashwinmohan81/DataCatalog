export * from './types';
export { domains } from './domains';
export { assets } from './assets';
export { applications } from './applications';
export { glossaries } from './glossaries';
export { glossaryTerms } from './glossary';
export { lineageGraphs } from './lineage';
export { dqRules, dqRuns } from './dq';
export { workflowTasks } from './workflows';
export { dataContracts } from './contracts';
export { connectors } from './connectors';
export { notifications } from './notifications';
export { personas } from './personas';

import { domains } from './domains';
import { assets } from './assets';
import { dataContracts } from './contracts';
import { glossaries } from './glossaries';
import { glossaryTerms } from './glossary';
import { applications } from './applications';

export function getApplicationById(id: string) {
  return applications.find((a) => a.id === id) ?? null;
}

export function getAssetsByApplicationId(applicationId: string) {
  return assets.filter((a) => a.applicationId === applicationId);
}

export function getDataProductById(id: string) {
  return getDataProductWithContext(id, []);
}

/** Resolve data product by id; if runtimeProducts contains the id, use it and resolve domain/subdomain from static domains. */
export function getDataProductWithContext(
  id: string,
  runtimeProducts: import('./types').DataProduct[]
): { domain: import('./types').Domain; subdomain: import('./types').Subdomain; dataProduct: import('./types').DataProduct } | null {
  const fromRuntime = runtimeProducts.find((p) => p.id === id);
  if (fromRuntime) {
    const domain = domains.find((d) => d.id === fromRuntime.domainId) ?? null;
    const subdomain = domain?.subdomains.find((s) => s.id === fromRuntime.subdomainId) ?? null;
    if (domain && subdomain) return { domain, subdomain, dataProduct: fromRuntime };
  }
  for (const d of domains) {
    for (const s of d.subdomains) {
      const dp = s.dataProducts.find((p) => p.id === id);
      if (dp) return { domain: d, subdomain: s, dataProduct: dp };
    }
  }
  return null;
}

export function getAssetById(id: string) {
  return assets.find((a) => a.id === id) ?? null;
}

export function getContractByAssetId(assetId: string) {
  return dataContracts.find((c) => c.assetId === assetId) ?? null;
}

export function getContractById(id: string) {
  return dataContracts.find((c) => c.id === id) ?? null;
}

/** Contracts pending producer approval (for producer app to approve/reject). */
export function getContractsPendingApproval(producerApplicationId: string) {
  return dataContracts.filter((c) => {
    if (c.status !== 'pending_approval') return false;
    const asset = assets.find((a) => a.id === c.assetId);
    return asset?.applicationId === producerApplicationId;
  });
}

export function getDomainById(id: string) {
  return domains.find((d) => d.id === id) ?? null;
}

export function getGlossaryById(id: string) {
  return glossaries.find((g) => g.id === id) ?? null;
}

/** Asset IDs that have at least one column linked to a term in this glossary. */
export function getImpactedAssetIdsForGlossary(glossaryId: string): string[] {
  const assetIds = new Set<string>();
  glossaryTerms
    .filter((t) => t.glossaryId === glossaryId)
    .forEach((t) => t.linkedColumnIds.forEach(({ assetId }) => assetIds.add(assetId)));
  return Array.from(assetIds);
}
