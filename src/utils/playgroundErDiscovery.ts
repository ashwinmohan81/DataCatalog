import type { DataAsset, Column } from '../data/mock/types';

export type ErMatchReason = 'glossary' | 'logical_attribute' | 'name_type';

export interface SuggestedRelationship {
  assetIdA: string;
  columnIdA: string;
  assetIdB: string;
  columnIdB: string;
  reason: ErMatchReason;
  /** Set when reason is 'glossary' (shared term id). */
  glossaryTermId?: string;
}

function compatibleTypes(typeA: string, typeB: string): boolean {
  const a = typeA.toUpperCase();
  const b = typeB.toUpperCase();
  if (a === b) return true;
  const numeric = ['INT', 'BIGINT', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE'];
  const str = ['VARCHAR', 'CHAR', 'TEXT', 'STRING'];
  if (numeric.includes(a) && numeric.includes(b)) return true;
  if (str.includes(a) && str.includes(b)) return true;
  return false;
}

/**
 * Given a set of asset IDs and the full assets list, returns suggested ER relationships
 * based on shared glossary terms, shared logical attribute IDs, or same column name + compatible type.
 */
export function getSuggestedRelationships(
  assetIds: string[],
  assets: DataAsset[]
): SuggestedRelationship[] {
  const idSet = new Set(assetIds);
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const sandboxAssets = assetIds
    .map((id) => assetMap.get(id))
    .filter((a): a is DataAsset => a != null);
  const seen = new Set<string>();

  const results: SuggestedRelationship[] = [];

  for (let i = 0; i < sandboxAssets.length; i++) {
    for (let j = i + 1; j < sandboxAssets.length; j++) {
      const assetA = sandboxAssets[i];
      const assetB = sandboxAssets[j];
      if (!assetA || !assetB || assetA.id === assetB.id) continue;

      for (const colA of assetA.columns) {
        for (const colB of assetB.columns) {
          const key = [assetA.id, colA.id, assetB.id, colB.id].sort().join('|');
          if (seen.has(key)) continue;

          let reason: ErMatchReason | null = null;
          let glossaryTermId: string | undefined;

          if (colA.logicalAttributeId && colB.logicalAttributeId && colA.logicalAttributeId === colB.logicalAttributeId) {
            reason = 'logical_attribute';
          } else if (colA.glossaryTermIds.length > 0 && colB.glossaryTermIds.length > 0) {
            const shared = colA.glossaryTermIds.find((t) => colB.glossaryTermIds.includes(t));
            if (shared) {
              reason = 'glossary';
              glossaryTermId = shared;
            }
          }
          if (!reason && colA.name === colB.name && compatibleTypes(colA.type, colB.type)) {
            reason = 'name_type';
          }

          if (reason) {
            seen.add(key);
            results.push({
              assetIdA: assetA.id,
              columnIdA: colA.id,
              assetIdB: assetB.id,
              columnIdB: colB.id,
              reason,
              ...(glossaryTermId && { glossaryTermId }),
            });
          }
        }
      }
    }
  }

  return results;
}
