import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getDomainById, domains, assets, applications, getDataProductWithContext } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import type { AssetPlatform } from '../data/mock/types';
import { Badge } from '../components/Badge';
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

export function CatalogPage() {
  const { domainId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const zone = searchParams.get('zone') ?? '';
  const applicationId = searchParams.get('application') ?? '';
  const platform = (searchParams.get('platform') ?? '') as AssetPlatform | '';
  const domain = domainId ? getDomainById(domainId) : null;
  const runtimeProducts = useAppStore((s) => s.dataProducts);
  const assetDataProductOverrides = useAppStore((s) => s.assetDataProductOverrides);
  const staticProductList = domains.flatMap((d) => d.subdomains.flatMap((s) => s.dataProducts));
  const getProductName = (dataProductId: string | undefined) =>
    !dataProductId ? null
    : getDataProductWithContext(dataProductId, runtimeProducts)?.dataProduct.name
    ?? staticProductList.find((dp) => dp.id === dataProductId)?.name
    ?? dataProductId;
  let assetList = domainId
    ? assets.filter((a) => a.domainId === domainId)
    : assets;
  if (zone) assetList = assetList.filter((a) => a.zone === zone);
  if (applicationId) assetList = assetList.filter((a) => a.applicationId === applicationId);
  if (platform) assetList = assetList.filter((a) => a.platform === platform);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{domain ? domain.name : 'Catalog'}</h1>
      {domain && <p className={styles.muted}>{domain.description}</p>}
      {!domain && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Domains</h2>
          <ul className={styles.resultList}>
            {domains.map((d) => (
              <li key={d.id}>
                <Link to={`/catalog/domain/${d.id}`} className={styles.resultLink}>
                  <span className={styles.resultName}>{d.name}</span>
                  <span className={styles.resultMeta}>{d.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.section}>
        <div className={styles.insightsFilterRow} style={{ marginBottom: 'var(--space-3)' }}>
          <label htmlFor="catalog-zone" className={styles.muted} style={{ marginRight: 'var(--space-2)' }}>Zone:</label>
          <select
            id="catalog-zone"
            value={zone}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('zone', e.target.value); else next.delete('zone');
              setSearchParams(next);
            }}
            className={styles.insightsFilterSelect}
          >
            <option value="">All</option>
            <option value="raw">Raw</option>
            <option value="enriched">Enriched</option>
            <option value="conformed">Conformed</option>
          </select>
          <label htmlFor="catalog-app" className={styles.muted} style={{ marginRight: 'var(--space-2)', marginLeft: 'var(--space-4)' }}>Application:</label>
          <select
            id="catalog-app"
            value={applicationId}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('application', e.target.value); else next.delete('application');
              setSearchParams(next);
            }}
            className={styles.insightsFilterSelect}
          >
            <option value="">All</option>
            {applications.filter((a) => a.type === 'producer').map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <label htmlFor="catalog-platform" className={styles.muted} style={{ marginRight: 'var(--space-2)', marginLeft: 'var(--space-4)' }}>Platform:</label>
          <select
            id="catalog-platform"
            value={platform}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value) next.set('platform', e.target.value); else next.delete('platform');
              setSearchParams(next);
            }}
            className={styles.insightsFilterSelect}
          >
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
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
