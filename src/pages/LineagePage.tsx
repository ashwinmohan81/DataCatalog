import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { assets, lineageGraphs, domains, applications } from '../data/mock';
import { Card, CardHeader } from '../components/Card';
import { LineageFlowCanvas } from '../components/LineageFlowCanvas';
import styles from './Page.module.css';

function getAssetById(id: string) {
  return assets.find((a) => a.id === id) ?? null;
}

function getDataProductName(dataProductId: string | undefined): string {
  if (!dataProductId) return '—';
  for (const d of domains) {
    for (const s of d.subdomains) {
      const dp = s.dataProducts.find((p) => p.id === dataProductId);
      if (dp) return dp.name;
    }
  }
  return dataProductId;
}

function filterAssetsByScope(
  list: typeof assets,
  params: { domainId?: string; subdomainId?: string; dataProductId?: string; owner?: string; applicationId?: string; search?: string }
) {
  let out = list;
  if (params.domainId) out = out.filter((a) => a.domainId === params.domainId);
  if (params.subdomainId) out = out.filter((a) => a.subdomainId === params.subdomainId);
  if (params.dataProductId) out = out.filter((a) => a.dataProductId === params.dataProductId);
  if (params.owner) out = out.filter((a) => a.owner === params.owner);
  if (params.applicationId) out = out.filter((a) => a.applicationId === params.applicationId);
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    out = out.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.displayName.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return out;
}

const LINEAGE_COLUMN_TABS_MAX = 8;

export function LineagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const assetId = searchParams.get('asset') ?? '';
  const selectedColumnId = searchParams.get('column') ?? '';
  const [searchQuery, setSearchQuery] = useState('');
  const [domainId, setDomainId] = useState('');
  const [subdomainId, setSubdomainId] = useState('');
  const [dataProductId, setDataProductId] = useState('');
  const [owner, setOwner] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [lineageViewMode, setLineageViewMode] = useState<'flow' | 'columnBased'>('flow');

  const asset = assetId ? getAssetById(assetId) : null;
  const graphsForAsset = useMemo(
    () => (assetId ? lineageGraphs.filter((g) => g.assetId === assetId) : []),
    [assetId]
  );

  const filteredAssets = useMemo(
    () =>
      filterAssetsByScope(assets, {
        domainId: domainId || undefined,
        subdomainId: subdomainId || undefined,
        dataProductId: dataProductId || undefined,
        owner: owner || undefined,
        applicationId: applicationId || undefined,
        search: searchQuery || undefined,
      }),
    [domainId, subdomainId, dataProductId, owner, applicationId, searchQuery]
  );

  const selectedDomain = domainId ? domains.find((d) => d.id === domainId) : null;
  const subdomains = selectedDomain ? selectedDomain.subdomains : [];
  const dataProducts = useMemo(() => {
    if (!subdomainId) return [];
    const sub = subdomains.find((s) => s.id === subdomainId);
    return sub ? sub.dataProducts : [];
  }, [subdomainId, subdomains]);
  const ownersList = useMemo(() => Array.from(new Set(assets.map((a) => a.owner))).sort(), []);
  const hasScopeFilters = domainId || subdomainId || dataProductId || owner || applicationId || searchQuery.trim();
  const clearScopeFilters = () => {
    setDomainId('');
    setSubdomainId('');
    setDataProductId('');
    setOwner('');
    setApplicationId('');
    setSearchQuery('');
  };

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
        <div className={styles.insightsFilterRow} style={{ marginBottom: 'var(--space-3)' }}>
          <input
            type="search"
            placeholder="Search by data asset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.insightsFilterInput}
            aria-label="Search data asset"
          />
          <select
            value={domainId}
            onChange={(e) => { setDomainId(e.target.value); setSubdomainId(''); setDataProductId(''); }}
            className={styles.insightsFilterSelect}
            aria-label="Domain"
          >
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            value={subdomainId}
            onChange={(e) => { setSubdomainId(e.target.value); setDataProductId(''); }}
            className={styles.insightsFilterSelect}
            aria-label="Subdomain"
            disabled={!domainId}
          >
            <option value="">All subdomains</option>
            {subdomains.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={dataProductId}
            onChange={(e) => setDataProductId(e.target.value)}
            className={styles.insightsFilterSelect}
            aria-label="Data product"
            disabled={!subdomainId}
          >
            <option value="">All products</option>
            {dataProducts.map((dp) => (
              <option key={dp.id} value={dp.id}>{dp.name}</option>
            ))}
          </select>
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={styles.insightsFilterSelect}
            aria-label="Owner"
          >
            <option value="">All owners</option>
            {ownersList.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className={styles.insightsFilterSelect}
            aria-label="Application"
          >
            <option value="">All applications</option>
            {applications.map((app) => (
              <option key={app.id} value={app.id}>{app.name}</option>
            ))}
          </select>
          {hasScopeFilters && (
            <button type="button" onClick={clearScopeFilters} className={styles.insightsFilterClear}>
              Clear filters
            </button>
          )}
        </div>
        {hasScopeFilters && (
          <p className={styles.muted} style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)' }}>
            Showing {filteredAssets.length} asset(s)
          </p>
        )}
        <div className={styles.lineageFinderRow}>
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
                        {getDataProductName(a.dataProductId ?? undefined)} · {a.owner}
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
            <p className={styles.muted}>Select a column to view its lineage flow. Expand nodes to see attributes.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
              <span className={styles.muted}>View:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <input type="radio" name="lineageView" checked={lineageViewMode === 'flow'} onChange={() => setLineageViewMode('flow')} />
                Flow
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <input type="radio" name="lineageView" checked={lineageViewMode === 'columnBased'} onChange={() => setLineageViewMode('columnBased')} />
                Column-based
              </label>
            </div>
            {graphsForAsset.length > LINEAGE_COLUMN_TABS_MAX ? (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <label className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Select column</label>
                <select
                  value={selectedColumnId || graphsForAsset[0]?.columnId || ''}
                  onChange={(e) => setColumn(e.target.value)}
                  style={{ padding: 'var(--space-2)', minWidth: 220 }}
                >
                  {graphsForAsset.map((g) => {
                    const col = asset.columns.find((c) => c.id === g.columnId);
                    const columnName = col?.name ?? g.columnId;
                    return (
                      <option key={g.columnId} value={g.columnId}>
                        {columnName}
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
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
            )}
            {selectedColumnGraph && (
              <>
                <LineageFlowCanvas graph={selectedColumnGraph} expandNodesByDefault={lineageViewMode === 'columnBased'} />
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

