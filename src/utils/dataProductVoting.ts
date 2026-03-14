import type { DataContract } from '../data/mock/types';
import type { DataProduct } from '../data/mock/types';
import { getAssetById } from '../data/mock';

/** All contracts (static + runtime) for a given list. */
export function hasConsumedDataProduct(
  staticContracts: DataContract[],
  runtimeContracts: DataContract[],
  assetDataProductOverrides: Record<string, string>,
  dataProductId: string,
  applicationId: string
): boolean {
  const allContracts = [...staticContracts, ...runtimeContracts];
  const approved = allContracts.filter((c) => c.status === 'approved' && c.requestedByApplicationId === applicationId);
  return approved.some((c) => {
    const asset = getAssetById(c.assetId);
    const dpId = assetDataProductOverrides[c.assetId] ?? asset?.dataProductId;
    return dpId === dataProductId;
  });
}

/** Count of distinct consumer applications that have consumed this data product (approved contract for an asset in the product). */
export function getConsumerAppCountForDataProduct(
  staticContracts: DataContract[],
  runtimeContracts: DataContract[],
  assetDataProductOverrides: Record<string, string>,
  dataProductId: string
): number {
  const allContracts = [...staticContracts, ...runtimeContracts];
  const consumerIds = new Set<string>();
  for (const c of allContracts) {
    if (c.status !== 'approved' || !c.requestedByApplicationId) continue;
    const asset = getAssetById(c.assetId);
    const dpId = assetDataProductOverrides[c.assetId] ?? asset?.dataProductId;
    if (dpId === dataProductId) consumerIds.add(c.requestedByApplicationId);
  }
  return consumerIds.size;
}

/** Producer application IDs for a data product (from output port assets' applicationId). */
export function getProducerApplicationIdsForDataProduct(dataProduct: DataProduct): string[] {
  const ids = new Set<string>();
  for (const assetId of dataProduct.outputPortAssetIds) {
    const asset = getAssetById(assetId);
    if (asset?.applicationId) ids.add(asset.applicationId);
  }
  return Array.from(ids);
}

/** Net vote score for a data product (sum of 1 and -1). */
export function getNetScore(
  dataProductVotes: Record<string, Record<string, number>>,
  dataProductId: string
): number {
  const inner = dataProductVotes[dataProductId];
  if (!inner) return 0;
  return Object.values(inner).reduce((sum, v) => sum + v, 0);
}

/** Total vote count for a data product. */
export function getVoteCount(
  dataProductVotes: Record<string, Record<string, number>>,
  dataProductId: string
): number {
  const inner = dataProductVotes[dataProductId];
  if (!inner) return 0;
  return Object.keys(inner).length;
}

export type DataProductComment = {
  id: string;
  dataProductId: string;
  applicationId: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  producerResponse?: string;
  producerResponseAt?: string;
};

/** Get the single comment for (dataProductId, applicationId). */
export function getComment(
  comments: DataProductComment[],
  dataProductId: string,
  applicationId: string
): DataProductComment | undefined {
  return comments.find((c) => c.dataProductId === dataProductId && c.applicationId === applicationId);
}
