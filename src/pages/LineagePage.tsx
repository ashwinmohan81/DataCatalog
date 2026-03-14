import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { assets, lineageGraphs, domains } from '../data/mock';
import { Card, CardHeader } from '../components/Card';
import { LineageFlowCanvas } from '../components/LineageFlowCanvas';
import styles from './Page.module.css';

function getAssetById(id: string) {
  return assets.find((a) => a.id === id) ?? null;
}

function getDataProductName(dataProductId: string): string {
  for (const d of domains) {
    for (const s of d.subdomains) {
      const dp = s.dataProducts.find((p) => p.id === dataProductId);
      if (dp) return dp.name;
    }
  }
  return dataProductId;
}

export function LineagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const assetId = searchParams.get('asset') ?? '';
  const selectedColumnId = searchParams.get('column') ?? '';
  const [searchQuery, setSearchQuery] = useState('');

  const asset = assetId ? getAssetById(assetId) : null;
  const graphsForAsset = useMemo(
    () => (assetId ? lineageGraphs.filter((g) => g.assetId === assetId) : []),
    [assetId]
  );

  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.trim().toLowerCase();
    return assets.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.displayName.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const assetsWithLineage = useMemo(
    () => assets.filter((a) => lineageGraphs.some((g) => g.assetId === a.id)),
    []
  );

  const setAsset = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('asset', id);
    else next.delete('asset');
    next.delete('column');
    setSearchParams(next);
  };

  const setColumn = (columnId: string) => {
    const next = new URLSearchParams(searchParams);
    if (columnId) next.set('column', columnId);
    else next.delete('column');
    setSearchParams(next);
  };

  const selectedColumnGraph = useMemo(
    () =>
      selectedColumnId && assetId
        ? graphsForAsset.find((g) => g.columnId === selectedColumnId)
        : graphsForAsset[0] ?? null,
    [graphsForAsset, selectedColumnId, assetId]
  );

  const assetLevelSummary = useMemo(() => {
    if (!assetId || graphsForAsset.length === 0) return null;
    const upstream = new Set<string>();
    const downstream = new Set<string>();
    const columnNames = new Set<string>();
    graphsForAsset.forEach((g) => {
      g.nodes.forEach((n) => {
        if (n.type === 'source') upstream.add(n.name);
        if (n.type === 'destination' && n.assetId !== assetId) downstream.add(n.name);
        if (n.type === 'destination' && n.assetId === assetId) columnNames.add(g.edges.find((e) => e.to === n.id)?.columnName ?? '');
      });
    });
    return {
      upstream: Array.from(upstream),
      downstream: Array.from(downstream),
      columnCount: graphsForAsset.length,
    };
  }, [assetId, graphsForAsset]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Data lineage</h1>
      <p className={styles.muted}>Find a data asset and view asset-level and column-level lineage.</p>

      {/* Asset finder */}
      <Card className={styles.lineageFinderCard}>
        <CardHeader title="Find data asset" />
        <div className={styles.lineageFinderRow}>
          <input
            type="search"
            placeholder="Search assets by name or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.insightsFilterInput}
          />
          {asset && (
            <span className={styles.lineageSelectedAsset}>
              Selected: <strong>{asset.displayName}</strong>
              <button type="button" onClick={() => setAsset('')} className={styles.lineageClearAsset} aria-label="Clear selection">
                ×
              </button>
            </span>
          )}
        </div>
        <div className={styles.lineageAssetList}>
          {filteredAssets.length === 0 ? (
            <p className={styles.muted}>No assets match.</p>
          ) : (
            <ul className={styles.lineageAssetListUl}>
              {filteredAssets.map((a) => {
                const hasLineage = lineageGraphs.some((g) => g.assetId === a.id);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setAsset(a.id)}
                      className={`${styles.lineageAssetItem} ${a.id === assetId ? styles.lineageAssetItemActive : ''}`}
                    >
                      <span className={styles.resultName}>{a.displayName}</span>
                      <span className={styles.resultMeta}>
                        {getDataProductName(a.dataProductId)} · {a.owner}
                        {hasLineage && <span className={styles.lineageHasData}> · Has lineage</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {!asset && (
        <Card>
          <CardHeader title="Assets with lineage data" />
          <p className={styles.muted}>Select an asset above to view lineage. These assets have at least one column with lineage:</p>
          <ul className={styles.resultList}>
            {assetsWithLineage.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => setAsset(a.id)} className={styles.resultLink} style={{ width: '100%', textAlign: 'left' }}>
                  <span className={styles.resultName}>{a.displayName}</span>
                  <span className={styles.resultMeta}>
                    {lineageGraphs.filter((g) => g.assetId === a.id).length} column(s) with lineage
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {asset && graphsForAsset.length === 0 && (
        <Card>
          <CardHeader title="No lineage data" />
          <p className={styles.muted}>No lineage is recorded for <strong>{asset.displayName}</strong>. Lineage may be added after scanning or from integration metadata.</p>
          <Link to={`/asset/${asset.id}`}>View asset detail →</Link>
        </Card>
      )}

      {asset && assetLevelSummary && (
        <>
          <Card>
            <CardHeader title="Asset-level lineage" />
            <p className={styles.muted}>Summary for <strong>{asset.displayName}</strong>. This asset has lineage for {assetLevelSummary.columnCount} column(s).</p>
            <div className={styles.lineageSummaryGrid}>
              <div>
                <h3 className={styles.lineageSummaryTitle}>Upstream (sources)</h3>
                <ul className={styles.lineageSummaryList}>
                  {assetLevelSummary.upstream.length === 0 ? (
                    <li className={styles.muted}>None</li>
                  ) : (
                    assetLevelSummary.upstream.map((name) => <li key={name}>{name}</li>)
                  )}
                </ul>
              </div>
              <div>
                <h3 className={styles.lineageSummaryTitle}>Downstream (consumers)</h3>
                <ul className={styles.lineageSummaryList}>
                  {assetLevelSummary.downstream.length === 0 ? (
                    <li className={styles.muted}>None</li>
                  ) : (
                    assetLevelSummary.downstream.map((name) => <li key={name}>{name}</li>)
                  )}
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Column-level lineage" />
            <p className={styles.muted}>Select a column to view its lineage flow.</p>
            <div className={styles.lineageColumnTabs}>
              {graphsForAsset.map((g) => {
                const col = asset.columns.find((c) => c.id === g.columnId);
                const columnName = col?.name ?? g.columnId;
                const isSelected = (selectedColumnId && g.columnId === selectedColumnId) || (!selectedColumnId && graphsForAsset[0]?.columnId === g.columnId);
                return (
                  <button
                    key={g.columnId}
                    type="button"
                    onClick={() => setColumn(g.columnId)}
                    className={`${styles.lineageColumnTab} ${isSelected ? styles.lineageColumnTabActive : ''}`}
                  >
                    <code>{columnName}</code>
                  </button>
                );
              })}
            </div>
            {selectedColumnGraph && (
              <>
                <LineageFlowCanvas graph={selectedColumnGraph} />
                <div className={styles.lineageGraphLegend}>
                  <span className={styles.lineageGraphLegendItem}><span className={styles.lineageLegendDotSource} /> Source</span>
                  <span className={styles.lineageGraphLegendItem}><span className={styles.lineageLegendDotTransform} /> Transform</span>
                  <span className={styles.lineageGraphLegendItem}><span className={styles.lineageLegendDotDest} /> Destination</span>
                </div>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

