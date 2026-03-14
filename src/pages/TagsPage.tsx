import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

export function TagsPage() {
  const customTags = useAppStore((s) => s.customTags);
  const addCustomTag = useAppStore((s) => s.addCustomTag);
  const removeCustomTag = useAppStore((s) => s.removeCustomTag);
  const [newTag, setNewTag] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const n = newTag.trim();
    if (n) {
      addCustomTag(n);
      setNewTag('');
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tag management</h1>
      <p className={styles.muted}>
        Add custom tags as a data owner. Use these tags to tag data asset attributes (columns) on each asset’s <strong>Tags</strong> tab.
      </p>

      <div style={{ marginBottom: 'var(--space-4)' }}><Card>
        <CardHeader title="Add tag" />
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="e.g. PII, BCBS 239, Sensitive"
            style={{ padding: 'var(--space-2)', minWidth: 200 }}
          />
          <button
            type="submit"
            disabled={!newTag.trim()}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: newTag.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Add tag
          </button>
        </form>
      </Card></div>

      <Card>
        <CardHeader title="Custom tags" />
        {customTags.length === 0 ? (
          <p className={styles.muted}>No custom tags yet. Add one above, then tag attributes on any asset’s Tags tab.</p>
        ) : (
          <ul className={styles.resultList}>
            {customTags.map((tag) => (
              <li key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)' }}>
                <Badge>{tag}</Badge>
                <button
                  type="button"
                  onClick={() => removeCustomTag(tag)}
                  style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)' }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        To tag attributes: open a <Link to="/catalog">data asset</Link> → <strong>Tags</strong> tab → add or remove tags per column.
      </p>
    </div>
  );
}
