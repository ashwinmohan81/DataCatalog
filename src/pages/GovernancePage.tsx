import { Link } from 'react-router-dom';
import { glossaryTerms, domains, assets } from '../data/mock';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

function glossaryMaturity(assetId: string): number {
  const asset = assets.find((a) => a.id === assetId);
  if (!asset || asset.columns.length === 0) return 100;
  const mapped = asset.columns.filter((c) => c.glossaryTermIds.length > 0).length;
  return Math.round((mapped / asset.columns.length) * 100);
}

export function GovernancePage() {
  const termCount = glossaryTerms.length;
  const domainCount = domains.length;
  const lowMaturity = assets.filter((a) => glossaryMaturity(a.id) < 80 && a.columns.length > 0);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Governance</h1>
      <p className={styles.muted}>Glossary, tags, and mapping maturity.</p>

      <div className={styles.grid2} style={{ marginBottom: 'var(--space-6)' }}>
        <Card>
          <CardHeader title="Glossary" />
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>{termCount}</p>
          <p className={styles.muted}>terms</p>
          <Link to="/glossary">View glossary →</Link>
        </Card>
        <Card>
          <CardHeader title="Domains" />
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>{domainCount}</p>
          <p className={styles.muted}>domains</p>
          <Link to="/catalog">View catalog →</Link>
        </Card>
      </div>

      <Card>
        <CardHeader title="Low glossary maturity" />
        <p className={styles.muted}>Assets with &lt;80% columns mapped to glossary.</p>
        {lowMaturity.length === 0 ? (
          <p className={styles.muted}>None.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Maturity</th>
                </tr>
              </thead>
              <tbody>
                {lowMaturity.map((a) => (
                  <tr key={a.id}>
                    <td><Link to={`/asset/${a.id}`}>{a.displayName}</Link></td>
                    <td>{glossaryMaturity(a.id)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
