import { useState, useMemo } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { getDomainById, domains, assets, applications, getDataProductWithContext } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import type { AssetPlatform } from '../data/mock/types';
import { Badge } from '../components/Badge';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

const PLATFORM_OPTIONS: { value: AssetPlatform | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'postgres', label: 'Postgres' },
  { value: 'oracle', label: 'Oracle' },
  { value: 's3', label: 'S3' },
  { value: 'kafka', label: 'Kafka' },
  { value: 'rest_api', label: 'REST API' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'other', label: 'Other' },
];

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

export function CatalogPage() {
  const navigate = useNavigate();
  const { domainId: domainIdFromUrl } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [assetSearch, setAssetSearch] = useState('');
  const [domainIdFilter, setDomainIdFilter] = useState('');
  const [subdomainId, setSubdomainId] = useState('');
  const [dataProductId, setDataProductId] = useState('');
  const [owner, setOwner] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const zone = searchParams.get('zone') ?? '';
  const platform = (searchParams.get('platform') ?? '') as AssetPlatform | '';
  const domainId = domainIdFromUrl ?? domainIdFilter;
  const domain = domainId ? getDomainById(domainId) : null;
  const runtimeProducts = useAppStore((s) => s.dataProducts);
  const assetDataProductOverrides = useAppStore((s) => s.assetDataProductOverrides);
  const staticProductList = domains.flatMap((d) => d.subdomains.flatMap((s) => s.dataProducts));
  const getProductName = (dataProductId: string | undefined) =>
    !dataProductId ? null
    : getDataProductWithContext(dataProductId, runtimeProducts)?.dataProduct.name
    ?? staticProductList.find((dp) => dp.id === dataProductId)?.name
    ?? dataProductId;

  const selectedDomain = domainId ? domains.find((d) => d.id === domainId) : null;
  const subdomains = selectedDomain ? selectedDomain.subdomains : [];
  const dataProductsInDomain = useMemo(
    () => (selectedDomain ? selectedDomain.subdomains.flatMap((s) => s.dataProducts) : []),
    [selectedDomain]
  );
  const dataProducts = useMemo(() => {
    if (!domainId) return [];
    if (subdomainId) {
      const sub = subdomains.find((s) => s.id === subdomainId);
      return sub ? sub.dataProducts : [];
    }
    return dataProductsInDomain;
  }, [domainId, subdomainId, subdomains, dataProductsInDomain]);
  const ownersList = useMemo(() => Array.from(new Set(assets.map((a) => a.owner))).sort(), []);

  let assetList = useMemo(
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
  if (zone) assetList = assetList.filter((a) => a.zone === zone);
  if (platform) assetList = assetList.filter((a) => a.platform === platform);

  const hasScopeFilters = domainIdFilter || subdomainId || dataProductId || owner || applicationId || assetSearch.trim() || zone || platform;
  const clearScopeFilters = () => {
    setAssetSearch('');
    setDomainIdFilter('');
    setSubdomainId('');
    setDataProductId('');
    setOwner('');
    setApplicationId('');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('zone');
      next.delete('platform');
      return next;
    });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{domain ? domain.name : 'Catalog'}</h1>
      {domain && <p className={styles.muted}>{domain.description}</p>}
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
            onChange={(e) => {
              const v = e.target.value;
              setSubdomainId('');
              setDataProductId('');
              if (domainIdFromUrl) {
                navigate(v ? `/catalog/domain/${v}` : '/catalog');
              } else {
                setDomainIdFilter(v);
              }
            }}
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
            disabled={!domainId}
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
            {applications.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select
            value={zone}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('zone', e.target.value); else next.delete('zone');
              setSearchParams(next);
            }}
            className={styles.insightsFilterSelect}
            aria-label="Zone"
          >
            <option value="">All zones</option>
            <option value="raw">Raw</option>
            <option value="enriched">Enriched</option>
            <option value="conformed">Conformed</option>
          </select>
          <select
            value={platform}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('platform', e.target.value); else next.delete('platform');
              setSearchParams(next);
            }}
            className={styles.insightsFilterSelect}
            aria-label="Platform"
          >
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
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
            Showing {assetList.length} asset(s)
          </p>
        )}
      </Card>

      {domain && dataProductsInDomain.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Data products ({dataProductsInDomain.length})</h2>
          <ul className={styles.resultList}>
            {dataProductsInDomain.map((dp) => {
              const sub = subdomains.find((s) => s.dataProducts.some((p) => p.id === dp.id));
              return (
                <li key={dp.id}>
                  <Link to={`/data-product/${dp.id}`} className={styles.resultLink}>
                    <span className={styles.resultName}>{dp.name}</span>
                    <span className={styles.resultMeta}>
                      {sub?.name ?? '—'} · {dp.owner}
                      {dp.certified && ' · Certified'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          {domain ? 'Data assets' : 'All assets'} ({assetList.length})
        </h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Platform</th>
                <th>Zone</th>
                <th>Tier</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Data product</th>
                <th>Last scan</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              {assetList.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/asset/${a.id}`}>{a.displayName}</Link>
                  </td>
                  <td>{a.platform ?? '—'}</td>
                  <td>{a.zone ? <Badge>{a.zone}</Badge> : '—'}</td>
                  <td><Badge variant={a.tier === 1 ? 'info' : 'default'}>Tier {a.tier}</Badge></td>
                  <td>{a.type}</td>
                  <td>{a.owner}</td>
                  <td>
                    {(() => {
                      const dpId = assetDataProductOverrides[a.id] ?? a.dataProductId;
                      const name = getProductName(dpId);
                      if (!dpId || name == null) return '—';
                      return <Link to={`/data-product/${dpId}`}>{name}</Link>;
                    })()}
                  </td>
                  <td>{a.lastScanAt ? new Date(a.lastScanAt).toLocaleString() : '—'}</td>
                  <td>
                    {a.certified && <Badge variant="success">Certified</Badge>}
                    {a.isOutputPort && <Badge variant="info">Output</Badge>}
                    {a.tags.slice(0, 2).map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
