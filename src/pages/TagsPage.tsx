import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

export function TagsPage() {
  const customTags = useAppStore((s) => s.customTags);
  const tagCategories = useAppStore((s) => s.tagCategories);
  const tagCategoryByTagName = useAppStore((s) => s.tagCategoryByTagName);
  const addCustomTag = useAppStore((s) => s.addCustomTag);
  const removeCustomTag = useAppStore((s) => s.removeCustomTag);
  const addTagCategory = useAppStore((s) => s.addTagCategory);
  const removeTagCategory = useAppStore((s) => s.removeTagCategory);
  const updateTagCategory = useAppStore((s) => s.updateTagCategory);
  const setTagCategoryForTag = useAppStore((s) => s.setTagCategoryForTag);

  const [newTag, setNewTag] = useState('');
  const [newTagCategoryId, setNewTagCategoryId] = useState<string>('');
  const [newCategory, setNewCategory] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const n = newTag.trim();
    if (n) {
      addCustomTag(n, newTagCategoryId || undefined);
      setNewTag('');
      setNewTagCategoryId('');
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const n = newCategory.trim();
    if (n) {
      addTagCategory(n);
      setNewCategory('');
    }
  };

  const startEditCategory = (id: string, name: string) => {
    setEditingCategoryId(id);
    setEditingCategoryName(name);
  };
  const saveEditCategory = () => {
    if (editingCategoryId && editingCategoryName.trim()) {
      updateTagCategory(editingCategoryId, editingCategoryName.trim());
      setEditingCategoryId(null);
      setEditingCategoryName('');
    }
  };

  // Group tags by category
  const uncategorized = customTags.filter((t) => !tagCategoryByTagName[t]);
  const byCategory = tagCategories.map((cat) => ({
    category: cat,
    tags: customTags.filter((t) => tagCategoryByTagName[t] === cat.id),
  }));

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tag management</h1>
      <p className={styles.muted}>
        Add categories to group tags, then add custom tags. Use these tags on each asset’s <strong>Schema</strong> tab to tag attributes.
      </p>

      <Card>
        <CardHeader title="Categories" />
        <p className={styles.muted}>Create categories to group your tags (e.g. Sensitivity, Domain, Regulation).</p>
        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. Sensitivity, Domain"
            style={{ padding: 'var(--space-2)', minWidth: 180 }}
          />
          <button
            type="submit"
            disabled={!newCategory.trim()}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: newCategory.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Add category
          </button>
        </form>
        {tagCategories.length > 0 && (
          <ul className={styles.resultList} style={{ marginTop: 'var(--space-3)' }}>
            {tagCategories.map((cat) => (
              <li key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2)' }}>
                {editingCategoryId === cat.id ? (
                  <>
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={(e) => setEditingCategoryName(e.target.value)}
                      onBlur={saveEditCategory}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditCategory()}
                      style={{ padding: 'var(--space-1)', width: 200 }}
                      autoFocus
                    />
                    <button type="button" onClick={saveEditCategory} style={{ fontSize: 'var(--text-sm)' }}>Save</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 500 }}>{cat.name}</span>
                    <button type="button" onClick={() => startEditCategory(cat.id, cat.name)} style={{ fontSize: 'var(--text-sm)' }}>Edit</button>
                    <button type="button" onClick={() => removeTagCategory(cat.id)} style={{ fontSize: 'var(--text-sm)' }}>Remove</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <Card>
          <CardHeader title="Add tag" />
          <form onSubmit={handleAddTag} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="e.g. PII, BCBS 239, Sensitive"
              style={{ padding: 'var(--space-2)', minWidth: 200 }}
            />
            <select
              value={newTagCategoryId}
              onChange={(e) => setNewTagCategoryId(e.target.value)}
              style={{ padding: 'var(--space-2)', minWidth: 160 }}
            >
              <option value="">No category</option>
              {tagCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
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
        </Card>
      </div>

      <div style={{ marginTop: 'var(--space-4)' }}>
        <Card>
        <CardHeader title="Tags by category" />
        {customTags.length === 0 ? (
          <p className={styles.muted}>No custom tags yet. Add a tag above, then assign them to attributes on any asset’s Schema tab.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {uncategorized.length > 0 && (
              <section>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Uncategorized</h3>
                <ul className={styles.resultList}>
                  {uncategorized.map((tag) => (
                    <li key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)' }}>
                      <Badge>{tag}</Badge>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <select
                          value={tagCategoryByTagName[tag] ?? ''}
                          onChange={(e) => setTagCategoryForTag(tag, e.target.value || null)}
                          style={{ padding: 'var(--space-1)', fontSize: 'var(--text-sm)' }}
                        >
                          <option value="">Uncategorized</option>
                          {tagCategories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => removeCustomTag(tag)} style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)' }}>Remove</button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {byCategory.map(({ category, tags }) =>
              tags.length > 0 ? (
                <section key={category.id}>
                  <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>{category.name}</h3>
                  <ul className={styles.resultList}>
                    {tags.map((tag) => (
                      <li key={tag} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)' }}>
                        <Badge>{tag}</Badge>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <select
                            value={tagCategoryByTagName[tag] ?? ''}
                            onChange={(e) => setTagCategoryForTag(tag, e.target.value || null)}
                            style={{ padding: 'var(--space-1)', fontSize: 'var(--text-sm)' }}
                          >
                            <option value="">Uncategorized</option>
                            {tagCategories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => removeCustomTag(tag)} style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)' }}>Remove</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null
            )}
          </div>
        )}
        </Card>
      </div>

      <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        To tag attributes: open a <Link to="/catalog">data asset</Link> → <strong>Schema</strong> tab → add or remove tags per column in the Tags column.
      </p>
    </div>
  );
}
