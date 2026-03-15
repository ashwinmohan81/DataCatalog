import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Glossary } from '../data/mock/types';
import { glossaries } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

export function GlossaryCreatePage() {
  const navigate = useNavigate();
  const addGlossary = useAppStore((s) => s.addGlossary);
  const runtimeGlossaries = useAppStore((s) => s.runtimeGlossaries);
  const allGlossaries = [...glossaries, ...runtimeGlossaries];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [steward, setSteward] = useState('');
  const [linkedGlossaryIds, setLinkedGlossaryIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleLinked = (id: string) => {
    setLinkedGlossaryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    const id = `glossary-${Date.now()}`;
    const g: Glossary = {
      id,
      name: name.trim(),
      description: description.trim(),
      owner: owner.trim() || 'Data Governance',
      steward: steward.trim() || undefined,
      linkedGlossaryIds,
    };
    addGlossary(g);
    setSubmitted(true);
    navigate(`/glossary/glossary/${id}`);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <p>Glossary created. Redirecting…</p>
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
      </div>
      <h1 className={styles.title}>Create glossary</h1>
      <p className={styles.muted}>Define a new glossary grouping. Add terms after creation.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
            <CardHeader title="Glossary details" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 520 }}>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Name *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Finance Glossary"
                  style={{ width: '100%', padding: 'var(--space-2)' }}
                />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Description *</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Purpose and scope of this glossary"
                  style={{ width: '100%', padding: 'var(--space-2)' }}
                />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Owner</span>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. Data Governance"
                  style={{ width: '100%', padding: 'var(--space-2)' }}
                />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Steward</span>
                <input
                  type="text"
                  value={steward}
                  onChange={(e) => setSteward(e.target.value)}
                  placeholder="Optional"
                  style={{ width: '100%', padding: 'var(--space-2)' }}
                />
              </label>
              <div>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Linked glossaries</span>
                <p className={styles.muted} style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                  Link to other glossaries for alignment (e.g. domain glossary → enterprise).
                </p>
                {allGlossaries.length === 0 ? (
                  <p className={styles.muted} style={{ fontSize: 'var(--text-sm)' }}>No other glossaries yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    {allGlossaries.map((g) => (
                      <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={linkedGlossaryIds.includes(g.id)}
                          onChange={() => toggleLinked(g.id)}
                        />
                        <span>{g.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
        <button
          type="submit"
          disabled={!name.trim() || !description.trim()}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: name.trim() && description.trim() ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
            color: name.trim() && description.trim() ? 'white' : 'var(--color-text-muted)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: name.trim() && description.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Create glossary
        </button>
      </form>
    </div>
  );
}
