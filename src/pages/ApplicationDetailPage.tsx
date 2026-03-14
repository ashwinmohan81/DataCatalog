import { useParams, Link } from 'react-router-dom';
import {
  getApplicationById,
  getAssetsByApplicationId,
  getDataProductById,
} from '../data/mock';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

const ZONE_ORDER: ('raw' | 'enriched' | 'conformed')[] = ['raw', 'enriched', 'conformed'];

export function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const application = applicationId ? getApplicationById(applicationId) : null;
  const inventory = application && application.type === 'producer' ? getAssetsByApplicationId(application.id) : [];
  const consumedProducts =
    application && application.type === 'consumer' && application.consumedDataProductIds
      ? application.consumedDataProductIds
          .map((id) => getDataProductById(id))
          .filter(Boolean) as NonNullable<ReturnType<typeof getDataProductById>>[]
      : [];

  if (!application) {
    return (
      <div className={styles.page}>
        <p>Application not found.</p>
      </div>
    );
  }

  const byZone = ZONE_ORDER.map((zone) => ({
    zone,
    assets: inventory.filter((a) => a.zone === zone),
  }));

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/inventory" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Inventory
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
        <h1 className={styles.title} style={{ margin: 0 }}>{application.name}</h1>
        <Badge variant={application.type === 'producer' ? 'info' : 'default'}>
          {application.type === 'producer' ? 'Producer' : 'Consumer'}
        </Badge>
      </div>
      <p className={styles.muted} style={{ marginBottom: 'var(--space-4)' }}>{application.description}</p>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Owner: {application.owner}</p>

      {application.type === 'producer' && (
        <>
          <Card>
            <CardHeader
              title="Physical inventory"
              action={
                <Link to={`/inventory/medallion?application=${application.id}`}>Medallion view →</Link>
              }
            />
            <p className={styles.muted}>Data assets owned by this application. Grouped by zone (raw → enriched → conformed).</p>
            {inventory.length === 0 ? (
              <p className={styles.muted}>No assets assigned.</p>
            ) : (
              byZone.map(({ zone, assets: zoneAssets }) => (
                <div key={zone} style={{ marginTop: 'var(--space-4)' }}>
                  <h3 className={styles.lineageSummaryTitle} style={{ textTransform: 'capitalize' }}>{zone}</h3>
                  {zoneAssets.length === 0 ? (
                    <p className={styles.muted}>No assets in {zone} zone.</p>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Asset</th>
                            <th>Platform</th>
                            <th>Type</th>
                            <th>Connector</th>
                            <th>Last scan</th>
                            <th>Owner</th>
                          </tr>
                        </thead>
                        <tbody>
                          {zoneAssets.map((a) => (
                            <tr key={a.id}>
                              <td><Link to={`/asset/${a.id}`}>{a.displayName}</Link></td>
                              <td>{a.platform ?? '—'}</td>
                              <td>{a.type}</td>
                              <td>{a.connectorName ?? '—'}</td>
                              <td>{a.lastScanAt ? new Date(a.lastScanAt).toLocaleString() : '—'}</td>
                              <td>{a.owner}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            )}
          </Card>
        </>
      )}

      {application.type === 'consumer' && (
        <Card>
          <CardHeader title="Consumed data products" />
          <p className={styles.muted}>Data products this consumer application uses.</p>
          {consumedProducts.length === 0 ? (
            <p className={styles.muted}>None configured.</p>
          ) : (
            <ul className={styles.resultList}>
              {consumedProducts.map(({ dataProduct, domain }) => (
                <li key={dataProduct.id}>
                  <Link to={`/data-product/${dataProduct.id}`} className={styles.resultLink}>
                    <span className={styles.resultName}>{dataProduct.name}</span>
                    <span className={styles.resultMeta}>{domain.name} · {dataProduct.owner}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
