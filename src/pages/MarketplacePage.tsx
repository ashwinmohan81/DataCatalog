import { Link } from 'react-router-dom';
import { domains, assets, getDomainById } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

const featuredProductIds = ['dp-exposure', 'dp-customer-attr', 'dp-var'];
const recentAssetIds = ['asset-exposure', 'asset-customer-attr', 'asset-npe'];

export function MarketplacePage() {
  const runtimeProducts = useAppStore((s) => s.dataProducts);
  const staticProducts = domains.flatMap((d) =>
    d.subdomains.flatMap((s) =>
      s.dataProducts.map((dp) => ({ ...dp, domainName: d.name, subdomainName: s.name }))
    )
  );
  const runtimeWithMeta = runtimeProducts
    .filter((p) => !staticProducts.some((s) => s.id === p.id))
    .map((p) => {
      const domain = getDomainById(p.domainId);
      const subdomain = domain?.subdomains.find((s) => s.id === p.subdomainId);
      return { ...p, domainName: domain?.name ?? '—', subdomainName: subdomain?.name ?? '—' };
    });
  const allProducts = [...staticProducts, ...runtimeWithMeta];
  const featured = allProducts.filter((p) => featuredProductIds.includes(p.id));
  const recent = recentAssetIds.map((id) => assets.find((a) => a.id === id)).filter(Boolean) as typeof assets;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Marketplace</h1>
      <p className={styles.muted}>Discover and consume curated data products.</p>
      <p style={{ marginBottom: 'var(--space-4)' }}>
        <Link
          to="/data-product/new"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Create data product
        </Link>
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Featured data products</h2>
        <div className={styles.grid2} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {featured.map((dp) => (
            <Card key={dp.id}>
              <CardHeader
                title={dp.name}
                action={dp.certified ? <Badge variant="success">Certified</Badge> : null}
              />
              <p className={styles.muted} style={{ marginBottom: 'var(--space-3)' }}>
                {dp.description}
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {dp.domainName} · {dp.owner}
              </p>
              <Link to={`/data-product/${dp.id}`} style={{ marginTop: 'var(--space-2)', display: 'inline-block' }}>
                View product →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Recently used</h2>
        <ul className={styles.resultList}>
          {recent.map((a) => (
            <li key={a.id}>
              <Link to={`/asset/${a.id}`} className={styles.resultLink}>
                <span className={styles.resultName}>{a.displayName}</span>
                <span className={styles.resultMeta}>{a.owner} · {a.type}</span>
                <span className={styles.badges}>
                  {a.certified && <Badge variant="success">Certified</Badge>}
                  {a.tags.slice(0, 2).map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>All data products</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain</th>
                <th>Owner</th>
                <th>SLA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((dp) => (
                <tr key={dp.id}>
                  <td>
                    <Link to={`/data-product/${dp.id}`}>{dp.name}</Link>
                  </td>
                  <td>{dp.domainName}</td>
                  <td>{dp.owner}</td>
                  <td>{dp.sla ?? '—'}</td>
                  <td>
                    {dp.certified && <Badge variant="success">Certified</Badge>}
                    {dp.contractId && <Badge variant="info">Contract</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
