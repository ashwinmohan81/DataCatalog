import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { assets, glossaryTerms, domains, applications } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Badge } from '../components/Badge';
import { getNetScore, getVoteCount } from '../utils/dataProductVoting';
import styles from './Page.module.css';

export function SearchPage() {
  const [params, setSearchParams] = useSearchParams();
  const dataProductVotes = useAppStore((s) => s.dataProductVotes);
  const q = (params.get('q') || '').toLowerCase();
  const zone = params.get('zone') ?? '';
  const applicationId = params.get('application') ?? '';
  const platform = params.get('platform') ?? '';

  const results = useMemo(() => {
    if (!q) return { assets: [], terms: [], products: [] };
    const allProducts: { id: string; name: string; domainName: string }[] = [];
    domains.forEach((d) =>
      d.subdomains.forEach((s) =>
        s.dataProducts.forEach((dp) => allProducts.push({ id: dp.id, name: dp.name, domainName: d.name }))
      )
    );
    let assetList = assets.filter((a) => a.name.toLowerCase().includes(q) || a.displayName.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q)));
    if (zone) assetList = assetList.filter((a) => a.zone === zone);
    if (applicationId) assetList = assetList.filter((a) => a.applicationId === applicationId);
    if (platform) assetList = assetList.filter((a) => a.platform === platform);
    return {
      assets: assetList,
      terms: glossaryTerms.filter((t) => t.name.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)),
      products: allProducts.filter((p) => p.name.toLowerCase().includes(q) || p.domainName.toLowerCase().includes(q)),
    };
  }, [q, zone, applicationId, platform]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Search{q ? `: "${params.get('q')}"` : ''}</h1>
      {!q && <p className={styles.muted}>Use the search bar above or enter a query in the URL: ?q=exposure</p>}
      {q && (
        <>
          <div className={styles.insightsFilterRow} style={{ marginBottom: 'var(--space-4)' }}>
            <label htmlFor="search-zone" className={styles.muted} style={{ marginRight: 'var(--space-2)' }}>Zone:</label>
            <select
              id="search-zone"
              value={zone}
              onChange={(e) => {
                const next = new URLSearchParams(params);
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
            <label htmlFor="search-app" className={styles.muted} style={{ marginLeft: 'var(--space-4)', marginRight: 'var(--space-2)' }}>Application:</label>
            <select
              id="search-app"
              value={applicationId}
              onChange={(e) => {
                const next = new URLSearchParams(params);
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
            <label htmlFor="search-platform" className={styles.muted} style={{ marginLeft: 'var(--space-4)', marginRight: 'var(--space-2)' }}>Platform:</label>
            <select
              id="search-platform"
              value={platform}
              onChange={(e) => {
                const next = new URLSearchParams(params);
                if (e.target.value) next.set('platform', e.target.value); else next.delete('platform');
                setSearchParams(next);
              }}
              className={styles.insightsFilterSelect}
            >
              <option value="">All</option>
              <option value="snowflake">Snowflake</option>
              <option value="bigquery">BigQuery</option>
              <option value="postgres">Postgres</option>
              <option value="oracle">Oracle</option>
              <option value="s3">S3</option>
              <option value="kafka">Kafka</option>
              <option value="rest_api">REST API</option>
              <option value="mysql">MySQL</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Data assets ({results.assets.length})</h2>
            {results.assets.length === 0 ? (
              <p className={styles.muted}>No assets found.</p>
            ) : (
              <ul className={styles.resultList}>
                {results.assets.map((a) => (
                  <li key={a.id}>
                    <Link to={`/asset/${a.id}`} className={styles.resultLink}>
                      <span className={styles.resultName}>{a.displayName}</span>
                      <span className={styles.resultMeta}>{a.name} · {a.type}{a.platform ? ` · ${a.platform}` : ''}{a.zone ? ` · ${a.zone}` : ''}</span>
                      <span className={styles.badges}>
                        {a.certified && <Badge variant="success">Certified</Badge>}
                        {a.isOutputPort && <Badge variant="info">Output</Badge>}
                        {a.tags.slice(0, 2).map((t) => (
                          <Badge key={t}>{t}</Badge>
                        ))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Glossary terms ({results.terms.length})</h2>
            {results.terms.length === 0 ? (
              <p className={styles.muted}>No glossary terms found.</p>
            ) : (
              <ul className={styles.resultList}>
                {results.terms.map((t) => (
                  <li key={t.id}>
                    <Link to={`/glossary/term/${t.id}`} className={styles.resultLink}>
                      <span className={styles.resultName}>{t.name}</span>
                      <span className={styles.resultMeta}>{t.definition.slice(0, 80)}…</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Data products ({results.products.length})</h2>
            {results.products.length === 0 ? (
              <p className={styles.muted}>No data products found.</p>
            ) : (
              <ul className={styles.resultList}>
                {results.products.map((p) => (
                  <li key={p.id}>
                    <Link to={`/data-product/${p.id}`} className={styles.resultLink}>
                      <span className={styles.resultName}>{p.name}</span>
                      <span className={styles.resultMeta}>
                        {p.domainName}
                        {getVoteCount(dataProductVotes, p.id) > 0 && (
                          <> · Rating: {getNetScore(dataProductVotes, p.id) >= 0 ? `+${getNetScore(dataProductVotes, p.id)}` : getNetScore(dataProductVotes, p.id)} ({getVoteCount(dataProductVotes, p.id)} vote{getVoteCount(dataProductVotes, p.id) !== 1 ? 's' : ''})</>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
