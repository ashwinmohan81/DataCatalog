import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { assets, domains, applications } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { getSuggestedRelationships, type ErMatchReason } from '../utils/playgroundErDiscovery';
import { Card, CardHeader } from '../components/Card';
import { PlaygroundErDiagram } from '../components/PlaygroundErDiagram';
import styles from './Page.module.css';

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

const REASON_LABEL: Record<ErMatchReason, string> = {
  glossary: 'Glossary term',
  logical_attribute: 'Logical attribute',
  name_type: 'Name + type',
};

export function PlaygroundPage() {
  const [domainId, setDomainId] = useState('');
  const [subdomainId, setSubdomainId] = useState('');
  const [dataProductId, setDataProductId] = useState('');
  const [owner, setOwner] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [assetSearch, setAssetSearch] = useState('');

  const playgroundAssetIds = useAppStore((s) => s.playgroundAssetIds);
  const addToPlayground = useAppStore((s) => s.addToPlayground);
  const removeFromPlayground = useAppStore((s) => s.removeFromPlayground);
  const clearPlayground = useAppStore((s) => s.clearPlayground);

  const filteredAssets = useMemo(
    () =>
      filterAssetsByScope(assets, {
        domainId: domainId || undefined,
        subdomainId: subdomainId || undefined,
        dataProductId: dataProductId || undefined,
        owner: owner || undefined,
        applicationId: applicationId || undefined,
        search: assetSearch || undefined,
      }),
    [domainId, subdomainId, dataProductId, owner, applicationId, assetSearch]
  );

  const selectedDomain = domainId ? domains.find((d) => d.id === domainId) : null;
  const subdomains = selectedDomain ? selectedDomain.subdomains : [];
  const dataProducts = useMemo(() => {
    if (!subdomainId) return [];
    const sub = subdomains.find((s) => s.id === subdomainId);
    return sub ? sub.dataProducts : [];
  }, [subdomainId, subdomains]);
  const ownersList = useMemo(() => Array.from(new Set(assets.map((a) => a.owner))).sort(), []);
  const hasScopeFilters = domainId || subdomainId || dataProductId || owner || applicationId || assetSearch.trim();
  const clearScopeFilters = () => {
    setDomainId('');
    setSubdomainId('');
    setDataProductId('');
    setOwner('');
    setApplicationId('');
    setAssetSearch('');
  };

  const sandboxAssets = useMemo(
    () => playgroundAssetIds.map((id) => assets.find((a) => a.id === id)).filter(Boolean) as typeof assets,
    [playgroundAssetIds]
  );
  const relationships = useMemo(
    () => getSuggestedRelationships(playgroundAssetIds, assets),
    [playgroundAssetIds]
  );
  const assetMap = useMemo(() => new Map(assets.map((a) => [a.id, a])), []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Consumer Playground</h1>
      <p className={styles.muted}>Pick data assets into a sandbox and discover suggested column-to-column relationships from the catalog.</p>

      <Card className={styles.insightsFilterCard}>
        <CardHeader title="Filter by scope" />
        <div className={styles.insightsFilterRow}>
          <input
            type="search"
            placeholder="Search by data asset..."
            value={assetSearch}
            onChange={(e) => setAssetSearch(e.target.value)}
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
        <div className={styles.lineageAssetList}>
          <ul className={styles.lineageAssetListUl}>
            {filteredAssets.map((a) => {
              const inPlayground = playgroundAssetIds.includes(a.id);
              return (
                <li key={a.id}>
                  <div className={styles.playgroundAssetRow}>
                    <Link to={`/asset/${a.id}`} className={styles.resultName} style={{ flex: 1 }}>
                      {a.displayName}
                    </Link>
                    <span className={styles.resultMeta} style={{ marginTop: 0, marginRight: 'var(--space-2)' }}>
                      {getDataProductName(a.dataProductId ?? undefined)} · {a.owner}
                    </span>
                    <button
                      type="button"
                      onClick={() => (inPlayground ? removeFromPlayground(a.id) : addToPlayground(a.id))}
                      className={inPlayground ? styles.playgroundBtnRemove : styles.playgroundBtnAdd}
                    >
                      {inPlayground ? 'Remove from playground' : 'Add to playground'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>

      <Card className={styles.section}>
        <CardHeader title={`Sandbox (${sandboxAssets.length} asset${sandboxAssets.length === 1 ? '' : 's'})`} />
        {sandboxAssets.length === 0 ? (
          <p className={styles.muted}>Add assets from the list above to build your sandbox.</p>
        ) : (
          <>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <button type="button" onClick={clearPlayground} className={styles.playgroundBtnRemove}>
                Clear sandbox
              </button>
            </div>
            <ul className={styles.resultList}>
              {sandboxAssets.map((a) => (
                <li key={a.id}>
                  <div className={styles.playgroundAssetRow}>
                    <Link to={`/asset/${a.id}`} className={styles.resultName} style={{ flex: 1 }}>{a.displayName}</Link>
                    <button type="button" onClick={() => removeFromPlayground(a.id)} className={styles.playgroundBtnRemove}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {sandboxAssets.length >= 2 && relationships.length > 0 && (
        <Card className={styles.section}>
          <CardHeader title="ER diagram" />
          <p className={styles.muted}>Entities and column-to-column relationships. Pan and zoom to explore.</p>
          <PlaygroundErDiagram assets={sandboxAssets} relationships={relationships} />
        </Card>
      )}

      {sandboxAssets.length >= 2 && (
        <Card className={styles.section}>
          <CardHeader title="Suggested relationships" />
          <p className={styles.muted}>Column-to-column links derived from shared glossary terms, logical attributes, or matching name and type.</p>
          {relationships.length === 0 ? (
            <p className={styles.muted}>No suggested relationships for this set of assets.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Asset A</th>
                    <th>Column A</th>
                    <th>Asset B</th>
                    <th>Column B</th>
                    <th>Match type</th>
                  </tr>
                </thead>
                <tbody>
                  {relationships.map((r, i) => {
                    const assetA = assetMap.get(r.assetIdA);
                    const assetB = assetMap.get(r.assetIdB);
                    const colA = assetA?.columns.find((c) => c.id === r.columnIdA);
                    const colB = assetB?.columns.find((c) => c.id === r.columnIdB);
                    return (
                      <tr key={`${r.assetIdA}-${r.columnIdA}-${r.assetIdB}-${r.columnIdB}-${i}`}>
                        <td>{assetA?.displayName ?? r.assetIdA}</td>
                        <td>{colA?.name ?? r.columnIdA}</td>
                        <td>{assetB?.displayName ?? r.assetIdB}</td>
                        <td>{colB?.name ?? r.columnIdB}</td>
                        <td>{REASON_LABEL[r.reason]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
