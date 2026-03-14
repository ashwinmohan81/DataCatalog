import { useSearchParams, Link } from 'react-router-dom';
import { assets, applications, getApplicationById, getAssetsByApplicationId } from '../data/mock';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

const ZONES: { id: 'raw' | 'enriched' | 'conformed'; label: string }[] = [
  { id: 'raw', label: 'Raw' },
  { id: 'enriched', label: 'Enriched' },
  { id: 'conformed', label: 'Conformed' },
];

export function MedallionPage() {
  const [params, setParams] = useSearchParams();
  const applicationId = params.get('application') ?? '';
  const application = applicationId ? getApplicationById(applicationId) : null;
  const assetList = applicationId && application?.type === 'producer'
    ? getAssetsByApplicationId(applicationId)
    : assets.filter((a) => a.zone != null);

  const byZone = ZONES.map(({ id, label }) => ({
    id,
    label,
    assets: assetList.filter((a) => a.zone === id),
  }));

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to={applicationId ? `/inventory/application/${applicationId}` : '/inventory'} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← {applicationId ? application?.name ?? 'Application' : 'Inventory'}
        </Link>
      </div>
      <h1 className={styles.title}>Medallion view</h1>
      <p className={styles.muted}>Assets grouped by zone: Raw → Enriched → Conformed.</p>

      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label htmlFor="medallion-app" className={styles.muted} style={{ marginRight: 'var(--space-2)' }}>Scope: </label>
        <select
          id="medallion-app"
          value={applicationId}
          onChange={(e) => {
            const next = new URLSearchParams(params);
            if (e.target.value) next.set('application', e.target.value);
            else next.delete('application');
            setParams(next);
          }}
          className={styles.insightsFilterSelect}
        >
          <option value="">All assets (with zone)</option>
          {applications.filter((a) => a.type === 'producer').map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.medallionColumns}>
        {byZone.map(({ id, label, assets: zoneAssets }) => (
          <Card key={id} className={styles.medallionColumn}>
            <CardHeader title={label} />
            <p className={styles.muted} style={{ marginBottom: 'var(--space-3)' }}>
              {zoneAssets.length} asset(s)
            </p>
            {zoneAssets.length === 0 ? (
              <p className={styles.muted}>No assets in this zone.</p>
            ) : (
              <ul className={styles.resultList} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {zoneAssets.map((a) => (
                  <li key={a.id} style={{ borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2) 0' }}>
                    <Link to={`/asset/${a.id}`} className={styles.resultName} style={{ display: 'block' }}>{a.displayName}</Link>
                    <span className={styles.resultMeta}>{a.owner} · {a.connectorName ?? a.type}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
