import { useState } from 'react';
import { Link } from 'react-router-dom';
import { domains, assets, getDomainById, dqRules, dataContracts } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { getNetScore, getVoteCount, getConsumerAppCountForDataProduct } from '../utils/dataProductVoting';
import { getDataProductDqSummary } from '../utils/dataProductDqSummary';
import styles from './Page.module.css';

const featuredProductIds = ['dp-exposure', 'dp-customer-attr', 'dp-var'];
const recentAssetIds = ['asset-exposure', 'asset-customer-attr', 'asset-npe'];
type SortBy = 'name' | 'domain' | 'rating';

export function MarketplacePage() {
  const runtimeProducts = useAppStore((s) => s.dataProducts);
  const dataProductVotes = useAppStore((s) => s.dataProductVotes);
  const runtimeDqRules = useAppStore((s) => s.runtimeDqRules);
  const contractRequests = useAppStore((s) => s.contractRequests);
  const assetDataProductOverrides = useAppStore((s) => s.assetDataProductOverrides);
  const [sortBy, setSortBy] = useState<SortBy>('name');
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
  let allProducts = [...staticProducts, ...runtimeWithMeta];
  if (sortBy === 'rating') {
    allProducts = [...allProducts].sort((a, b) => getNetScore(dataProductVotes, b.id) - getNetScore(dataProductVotes, a.id));
  } else if (sortBy === 'domain') {
    allProducts = [...allProducts].sort((a, b) => (a.domainName ?? '').localeCompare(b.domainName ?? ''));
  } else {
    allProducts = [...allProducts].sort((a, b) => a.name.localeCompare(b.name));
  }
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
              <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
                Rating: <strong>{getNetScore(dataProductVotes, dp.id) >= 0 ? `+${getNetScore(dataProductVotes, dp.id)}` : getNetScore(dataProductVotes, dp.id)}</strong>
                {getVoteCount(dataProductVotes, dp.id) > 0 && <span className={styles.muted}> ({getVoteCount(dataProductVotes, dp.id)} vote{getVoteCount(dataProductVotes, dp.id) !== 1 ? 's' : ''})</span>}
              </p>
              {(() => {
                const dq = getDataProductDqSummary(dp, dqRules, runtimeDqRules);
                const consumerCount = getConsumerAppCountForDataProduct(dataContracts, contractRequests, assetDataProductOverrides, dp.id);
                const ragColor = dq.status === 'green' ? 'var(--color-success)' : dq.status === 'amber' ? '#f59e0b' : dq.status === 'red' ? 'var(--color-error, #dc2626)' : 'var(--color-text-muted)';
                return (
                  <>
                    <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ragColor, flexShrink: 0 }} title={`DQ: ${dq.status}`} aria-hidden />
                      DQ: {dq.assetCount} asset{dq.assetCount !== 1 ? 's' : ''}, {dq.ruleCount} rule{dq.ruleCount !== 1 ? 's' : ''}
                      {dq.scorePct != null && <> · <strong>{dq.scorePct}%</strong></>}
                    </p>
                    <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)', color: 'var(--color-text-muted)' }}>
                      Consumers: <strong>{consumerCount}</strong>
                    </p>
                  </>
                );
              })()}
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
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <label htmlFor="marketplace-sort" className={styles.muted} style={{ marginRight: 'var(--space-2)' }}>Sort by:</label>
          <select
            id="marketplace-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className={styles.insightsFilterSelect}
          >
            <option value="name">Name</option>
            <option value="domain">Domain</option>
            <option value="rating">Rating (highest first)</option>
          </select>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain</th>
                <th>Owner</th>
                <th>Assets</th>
                <th>Rules</th>
                <th>DQ</th>
                <th>Consumers</th>
                <th>Rating</th>
                <th>SLA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allProducts.map((dp) => {
                const dq = getDataProductDqSummary(dp, dqRules, runtimeDqRules);
                const consumerCount = getConsumerAppCountForDataProduct(dataContracts, contractRequests, assetDataProductOverrides, dp.id);
                const ragColor = dq.status === 'green' ? 'var(--color-success)' : dq.status === 'amber' ? '#f59e0b' : dq.status === 'red' ? 'var(--color-error, #dc2626)' : 'var(--color-text-muted)';
                return (
                  <tr key={dp.id}>
                    <td>
                      <Link to={`/data-product/${dp.id}`}>{dp.name}</Link>
                    </td>
                    <td>{dp.domainName}</td>
                    <td>{dp.owner}</td>
                    <td>{dq.assetCount}</td>
                    <td>{dq.ruleCount}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: ragColor }} title={dq.status} aria-hidden />
                        {dq.scorePct != null ? `${dq.scorePct}%` : '—'}
                      </span>
                    </td>
                    <td>{consumerCount}</td>
                    <td>
                      {getNetScore(dataProductVotes, dp.id) >= 0 ? `+${getNetScore(dataProductVotes, dp.id)}` : getNetScore(dataProductVotes, dp.id)}
                      {getVoteCount(dataProductVotes, dp.id) > 0 && <span className={styles.muted}> ({getVoteCount(dataProductVotes, dp.id)})</span>}
                    </td>
                    <td>{dp.sla ?? '—'}</td>
                    <td>
                      {dp.certified && <Badge variant="success">Certified</Badge>}
                      {dp.contractId && <Badge variant="info">Contract</Badge>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
