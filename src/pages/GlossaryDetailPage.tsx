import { useParams, Link } from 'react-router-dom';
import {
  glossaries,
  glossaryTerms as staticTerms,
  assets,
  getGlossaryById,
  getImpactedAssetIdsForGlossary,
} from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

function getTermsForGlossary(glossaryId: string, runtimeTerms: typeof staticTerms) {
  const staticInGlossary = staticTerms.filter((t) => t.glossaryId === glossaryId);
  const runtimeInGlossary = runtimeTerms.filter((t) => t.glossaryId === glossaryId);
  return [...staticInGlossary, ...runtimeInGlossary];
}

export function GlossaryDetailPage() {
  const { glossaryId } = useParams();
  const runtimeTerms = useAppStore((s) => s.glossaryTerms);
  const glossary = glossaryId ? getGlossaryById(glossaryId) : null;
  const terms = glossary ? getTermsForGlossary(glossary.id, runtimeTerms) : [];
  const impactedAssetIds = glossary ? getImpactedAssetIdsForGlossary(glossary.id) : [];
  const impactedAssets = impactedAssetIds
    .map((id) => assets.find((a) => a.id === id))
    .filter(Boolean) as NonNullable<ReturnType<typeof assets.find>>[];
  const linkedGlossaries = glossary
    ? glossary.linkedGlossaryIds.map((id) => glossaries.find((g) => g.id === id)).filter(Boolean) as NonNullable<ReturnType<typeof glossaries.find>>[]
    : [];
  const linkedFromGlossaries = glossary
    ? glossaries.filter((g) => g.linkedGlossaryIds.includes(glossary.id))
    : [];

  if (!glossary) {
    return (
      <div className={styles.page}>
        <p>Glossary not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/glossary" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Glossaries
        </Link>
      </div>
      <h1 className={styles.title} style={{ marginBottom: 'var(--space-2)' }}>{glossary.name}</h1>
      <p className={styles.muted} style={{ marginBottom: 'var(--space-4)' }}>{glossary.description}</p>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        Owner: {glossary.owner}{glossary.steward ? ` · Steward: ${glossary.steward}` : ''}
      </p>
      <p style={{ marginBottom: 'var(--space-4)' }}>
        <Link
          to={`/glossary/glossary/${glossary.id}/term/new`}
          style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius)', textDecoration: 'none', display: 'inline-block' }}
        >
          Add term
        </Link>
      </p>

      {(linkedGlossaries.length > 0 || linkedFromGlossaries.length > 0) && (
        <Card>
          <CardHeader title="Glossary links" />
          <p className={styles.muted}>Link glossaries together for alignment and reuse.</p>
          {linkedGlossaries.length > 0 && (
            <>
              <h3 className={styles.lineageSummaryTitle}>Links to</h3>
              <ul className={styles.resultList}>
                {linkedGlossaries.map((g) => (
                  <li key={g.id}>
                    <Link to={`/glossary/glossary/${g.id}`} className={styles.resultLink}>
                      <span className={styles.resultName}>{g.name}</span>
                      <span className={styles.resultMeta}>{g.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          {linkedFromGlossaries.length > 0 && (
            <>
              <h3 className={styles.lineageSummaryTitle} style={{ marginTop: linkedGlossaries.length > 0 ? 'var(--space-4)' : 0 }}>Linked from</h3>
              <ul className={styles.resultList}>
                {linkedFromGlossaries.map((g) => (
                  <li key={g.id}>
                    <Link to={`/glossary/glossary/${g.id}`} className={styles.resultLink}>
                      <span className={styles.resultName}>{g.name}</span>
                      <span className={styles.resultMeta}>{g.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )}

      <Card>
        <CardHeader title="Impacted data assets" />
        <p className={styles.muted}>Data assets that have at least one column mapped to a term in this glossary.</p>
        {impactedAssets.length === 0 ? (
          <p className={styles.muted}>No data assets are currently mapped to terms in this glossary.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Mapped columns</th>
                </tr>
              </thead>
              <tbody>
                {impactedAssets.map((asset) => {
                  const mappedCount = terms.reduce(
                    (sum, t) => sum + t.linkedColumnIds.filter((c) => c.assetId === asset.id).length,
                    0
                  );
                  return (
                    <tr key={asset.id}>
                      <td><Link to={`/asset/${asset.id}`}>{asset.displayName}</Link></td>
                      <td>{asset.type}</td>
                      <td>{asset.owner}</td>
                      <td>{mappedCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Terms" />
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Term</th>
                <th>Definition</th>
                <th>Owner</th>
                <th>Linked columns</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/glossary/term/${t.id}`}>{t.name}</Link>
                  </td>
                  <td>{t.definition.slice(0, 80)}{t.definition.length > 80 ? '…' : ''}</td>
                  <td>{t.owner}</td>
                  <td>{t.linkedColumnIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
