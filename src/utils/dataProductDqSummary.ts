import type { DataProduct } from '../data/mock/types';
import type { DQRule } from '../data/mock/types';

export type DqStatus = 'green' | 'amber' | 'red' | 'grey';

export interface DataProductDqSummary {
  assetCount: number;
  ruleCount: number;
  passedCount: number;
  /** 0–100 when there are rules; null when no rules. */
  scorePct: number | null;
  status: DqStatus;
}

/**
 * Compute DQ summary for a data product: asset count, rule count, pass rate, and RAG status.
 * Rules are those (static + runtime) whose assetId is in the product's output port assets.
 * RAG: green >= 90%, amber >= 60%, red < 60%, grey = no rules.
 */
export function getDataProductDqSummary(
  dataProduct: DataProduct,
  staticRules: DQRule[],
  runtimeRules: DQRule[]
): DataProductDqSummary {
  const assetIds = new Set(dataProduct.outputPortAssetIds);
  const assetCount = assetIds.size;
  const allRules = [...staticRules, ...runtimeRules].filter((r) => assetIds.has(r.assetId));
  const ruleCount = allRules.length;
  const withResult = allRules.filter((r) => r.lastRunPassed !== undefined);
  const passedCount = withResult.filter((r) => r.lastRunPassed === true).length;
  const totalWithResult = withResult.length;
  const scorePct = totalWithResult === 0 ? null : Math.round((passedCount / totalWithResult) * 100);
  let status: DqStatus = 'grey';
  if (scorePct !== null) {
    if (scorePct >= 90) status = 'green';
    else if (scorePct >= 60) status = 'amber';
    else status = 'red';
  }
  return { assetCount, ruleCount, passedCount, scorePct, status };
}
