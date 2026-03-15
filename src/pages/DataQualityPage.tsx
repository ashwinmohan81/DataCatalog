import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dqRules, dqRuns, dqRuleTemplates, assets, domains, applications } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { getRuleDimension, DQ_DIMENSION_IDS, DQ_DIMENSION_LABELS, isTableLevelRule } from '../utils/dqDimensions';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

const getTemplate = (id: string) => dqRuleTemplates.find((t) => t.id === id);

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

export function DataQualityPage() {
  const [dimensionFilter, setDimensionFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [domainId, setDomainId] = useState('');
  const [subdomainId, setSubdomainId] = useState('');
  const [dataProductId, setDataProductId] = useState('');
  const [owner, setOwner] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [assetSearch, setAssetSearch] = useState('');

  const runtimeDqRules = useAppStore((s) => s.runtimeDqRules);
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
  const filteredAssetIds = useMemo(() => new Set(filteredAssets.map((a) => a.id)), [filteredAssets]);

  const allDqRulesRaw = useMemo(
    () => [...dqRules, ...runtimeDqRules].filter((r) => filteredAssetIds.has(r.assetId)),
    [runtimeDqRules, filteredAssetIds]
  );
  const allDqRules = allDqRulesRaw
    .filter((r) => !dimensionFilter || getRuleDimension(r, getTemplate) === dimensionFilter)
    .filter((r) => !levelFilter || (levelFilter === 'table' ? isTableLevelRule(r) : !isTableLevelRule(r)));
  const getDqRuleById = (id: string) => dqRules.find((r) => r.id === id) ?? runtimeDqRules.find((r) => r.id === id);
  const failedRuns = useMemo(
    () => dqRuns.filter((r) => !r.passed && filteredAssetIds.has(r.assetId)),
    [filteredAssetIds]
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

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Data quality</h1>
      <p className={styles.muted}>Rules, run history, and self-service DQ.</p>

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
          <p className={styles.muted} style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
            Showing {filteredAssets.length} asset(s) · {allDqRulesRaw.length} rules
          </p>
        )}
      </Card>

      <Card>
        <CardHeader title="Recent failures" />
        {failedRuns.length === 0 ? (
          <p className={styles.muted}>No recent failures.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Asset</th>
                  <th>Run at</th>
                  <th>Failed count</th>
                </tr>
              </thead>
              <tbody>
                {failedRuns.map((r) => (
                  <tr key={r.id}>
                    <td>{getDqRuleById(r.ruleId)?.name ?? r.ruleId}</td>
                    <td>
                      {assets.find((a) => a.id === r.assetId) ? (
                        <Link to={`/asset/${r.assetId}`}>{assets.find((a) => a.id === r.assetId)!.displayName}</Link>
                      ) : r.assetId}
                    </td>
                    <td>{new Date(r.runAt).toLocaleString()}</td>
                    <td><Badge variant="error">{r.failedCount ?? '—'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="All rules" />
        <div style={{ marginBottom: 'var(--space-3)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <span>
            <label className={styles.muted} style={{ marginRight: 'var(--space-2)' }}>Dimension:</label>
            <select
              value={dimensionFilter}
              onChange={(e) => setDimensionFilter(e.target.value)}
              style={{ padding: 'var(--space-2)', minWidth: 180 }}
              aria-label="DQ dimension filter"
            >
              <option value="">All dimensions</option>
              {DQ_DIMENSION_IDS.map((dim) => (
                <option key={dim} value={dim}>{DQ_DIMENSION_LABELS[dim]}</option>
              ))}
            </select>
          </span>
          <span>
            <label className={styles.muted} style={{ marginRight: 'var(--space-2)' }}>Level:</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              style={{ padding: 'var(--space-2)', minWidth: 120 }}
              aria-label="Rule level filter"
            >
              <option value="">All</option>
              <option value="column">Column</option>
              <option value="table">Table</option>
            </select>
          </span>
          {(dimensionFilter || levelFilter) && (
            <span className={styles.muted}>
              Showing {allDqRules.length} of {allDqRulesRaw.length} rules
            </span>
          )}
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Level</th>
                <th>Dimension</th>
                <th>Type</th>
                <th>Asset</th>
                <th>Last run</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {allDqRules.map((r) => {
                const asset = assets.find((a) => a.id === r.assetId);
                return (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{isTableLevelRule(r) ? 'Table' : 'Column'}</td>
                    <td><Badge variant="default">{DQ_DIMENSION_LABELS[getRuleDimension(r, getTemplate)]}</Badge></td>
                    <td>{r.type}</td>
                    <td>
                      <Link to={`/asset/${r.assetId}`}>
                        {asset?.displayName ?? r.assetId}
                      </Link>
                      {!isTableLevelRule(r) && r.columnId && asset && (
                        <span className={styles.muted} style={{ display: 'block', fontSize: 'var(--text-sm)' }}>
                          {asset.columns.find((c) => c.id === r.columnId)?.name ?? r.columnId}
                        </span>
                      )}
                    </td>
                    <td>{r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : '—'}</td>
                    <td>
                      {r.lastRunPassed === true ? <Badge variant="success">Passed</Badge> : r.lastRunPassed === false ? <Badge variant="error">Failed</Badge> : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
