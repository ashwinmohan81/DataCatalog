import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { GlossaryTerm } from '../data/mock/types';
import { glossaries } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

export function GlossaryTermCreatePage() {
  const { glossaryId } = useParams();
  const navigate = useNavigate();
  const runtimeGlossaries = useAppStore((s) => s.runtimeGlossaries);
  const allGlossaries = [...glossaries, ...runtimeGlossaries];
  const glossary = glossaryId ? allGlossaries.find((g) => g.id === glossaryId) ?? null : null;
  const addGlossaryTerm = useAppStore((s) => s.addGlossaryTerm);
  const [name, setName] = useState('');
  const [definition, setDefinition] = useState('');
  const [owner, setOwner] = useState('');
  const [steward, setSteward] = useState('');
  const [synonymsText, setSynonymsText] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!glossary) {
    return (
      <div className={styles.page}>
        <p>Glossary not found.</p>
        <Link to="/glossary">← Glossaries</Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = `term-new-${Date.now()}`;
    const synonyms = synonymsText.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    const tags = tagsText.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    const term: GlossaryTerm = {
      id,
      glossaryId: glossary.id,
      name: name.trim(),
      definition: definition.trim(),
      synonyms,
      owner: owner.trim() || glossary.owner,
      steward: steward.trim() || glossary.steward || glossary.owner,
      tags,
      linkedColumnIds: [],
    };
    addGlossaryTerm(term);
    setSubmitted(true);
    navigate(`/glossary/term/${id}`);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <p>Term created. Redirecting…</p>
        <Link to="/glossary">← Glossaries</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/glossary" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>← Glossaries</Link>
        {' · '}
        <Link to={`/glossary/glossary/${glossary.id}`} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{glossary.name}</Link>
      </div>
      <h1 className={styles.title}>Add glossary term</h1>
      <p className={styles.muted}>Create a term in <strong>{glossary.name}</strong>. Add synonyms and tags (comma-separated).</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
            <CardHeader title="Term details" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 520 }}>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Name *</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Exposure Amount" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Definition</span>
                <textarea value={definition} onChange={(e) => setDefinition(e.target.value)} rows={3} placeholder="Business definition" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Owner</span>
                <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder={glossary.owner} style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Steward</span>
                <input type="text" value={steward} onChange={(e) => setSteward(e.target.value)} placeholder={glossary.steward || glossary.owner} style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Synonyms (comma-separated)</span>
                <input type="text" value={synonymsText} onChange={(e) => setSynonymsText(e.target.value)} placeholder="e.g. EAD, Exposure at Default" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Tags (comma-separated)</span>
                <input type="text" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. risk, BCBS 239" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
            </div>
          </Card>
        </div>
        <button type="submit" disabled={!name.trim()} style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', cursor: name.trim() ? 'pointer' : 'not-allowed' }}>
          Create term
        </button>
      </form>
    </div>
  );
}
