import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { glossaryTerms as staticTerms, assets, glossaries } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

export function GlossaryTermPage() {
  const { termId } = useParams();
  const runtimeTerms = useAppStore((s) => s.glossaryTerms);
  const runtimeGlossaries = useAppStore((s) => s.runtimeGlossaries);
  const columnTermLinks = useAppStore((s) => s.columnTermLinks);
  const addColumnTermLink = useAppStore((s) => s.addColumnTermLink);
  const removeColumnTermLink = useAppStore((s) => s.removeColumnTermLink);
  const allGlossaries = [...glossaries, ...runtimeGlossaries];
  const term = termId ? (runtimeTerms.find((t) => t.id === termId) ?? staticTerms.find((t) => t.id === termId)) : null;
  const glossary = term ? allGlossaries.find((g) => g.id === term.glossaryId) ?? null : null;

  const linkedFromTerm = term?.linkedColumnIds ?? [];
  const linkedFromStore = termId ? columnTermLinks.filter((l) => l.termId === termId) : [];
  const linkedColumns = [
    ...linkedFromTerm.map(({ assetId, columnId }) => ({ assetId, columnId, fromStore: false })),
    ...linkedFromStore.map((l) => ({ assetId: l.assetId, columnId: l.columnId, fromStore: true })),
  ]
    .map(({ assetId, columnId, fromStore }) => {
      const asset = assets.find((a) => a.id === assetId);
      const col = asset?.columns.find((c) => c.id === columnId);
      return asset && col ? { asset, col, fromStore } : null;
    })
    .filter(Boolean) as { asset: NonNullable<typeof assets[0]>; col: NonNullable<typeof assets[0]['columns'][0]>; fromStore: boolean }[];

  const [linkAssetId, setLinkAssetId] = useState('');
  const [linkColumnId, setLinkColumnId] = useState('');
  const selectedAssetForLink = linkAssetId ? assets.find((a) => a.id === linkAssetId) : null;

  if (!term) {
    return (
      <div className={styles.page}>
        <p>Term not found.</p>
        <Link to="/glossary">← Glossaries</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/glossary" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Glossaries
        </Link>
        {glossary && (
          <>
            {' · '}
            <Link to={`/glossary/glossary/${glossary.id}`} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              {glossary.name}
            </Link>
          </>
        )}
      </div>
      <h1 className={styles.title} style={{ marginBottom: 'var(--space-2)' }}>{term.name}</h1>
      <p style={{ marginBottom: 'var(--space-4)' }}>{term.definition}</p>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        {glossary && <>Glossary: <Link to={`/glossary/glossary/${glossary.id}`}>{glossary.name}</Link> · </>}
        Owner: {term.owner} · Steward: {term.steward}
      </p>
      {term.synonyms.length > 0 && (
        <p style={{ fontSize: 'var(--text-sm)' }}><strong>Synonyms:</strong> {term.synonyms.join(', ')}</p>
      )}
      {term.tags.length > 0 && (
        <p style={{ fontSize: 'var(--text-sm)' }}><strong>Tags:</strong> {term.tags.join(', ')}</p>
      )}

      <Card>
        <CardHeader title="Linked columns" />
        {linkedColumns.length === 0 ? (
          <p className={styles.muted}>No columns linked. Use “Link to column” below to link this term to a data asset column.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Column</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {linkedColumns.map(({ asset, col, fromStore }) => (
                  <tr key={`${asset.id}-${col.id}`}>
                    <td><Link to={`/asset/${asset.id}`}>{asset.displayName}</Link></td>
                    <td><code>{col.name}</code></td>
                    <td>
                      {fromStore && (
                        <button type="button" onClick={() => removeColumnTermLink(asset.id, col.id, term.id)} style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)' }}>Unlink</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <h3 className={styles.sectionTitle}>Link to column</h3>
          <p className={styles.muted}>Associate this term with a data asset column (attribute).</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center', marginTop: 'var(--space-2)' }}>
            <select value={linkAssetId} onChange={(e) => { setLinkAssetId(e.target.value); setLinkColumnId(''); }} style={{ padding: 'var(--space-2)' }}>
              <option value="">Select asset…</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.displayName}</option>
              ))}
            </select>
            <select value={linkColumnId} onChange={(e) => setLinkColumnId(e.target.value)} style={{ padding: 'var(--space-2)' }} disabled={!selectedAssetForLink}>
              <option value="">Select column…</option>
              {selectedAssetForLink?.columns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={!linkAssetId || !linkColumnId}
              onClick={() => { if (linkAssetId && linkColumnId) addColumnTermLink(linkAssetId, linkColumnId, term.id); setLinkAssetId(''); setLinkColumnId(''); }}
              style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)' }}
            >
              Add link
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
