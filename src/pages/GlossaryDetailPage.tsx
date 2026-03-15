import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  glossaries as staticGlossaries,
  glossaryTerms as staticTerms,
  assets,
  getImpactedAssetIdsForGlossary,
} from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import type { GlossaryTerm } from '../data/mock/types';
import styles from './Page.module.css';

const PAGE_SIZE = 10;

function getTermsForGlossary(glossaryId: string, runtimeTerms: GlossaryTerm[]) {
  const staticInGlossary = staticTerms.filter((t) => t.glossaryId === glossaryId);
  const runtimeInGlossary = runtimeTerms.filter((t) => t.glossaryId === glossaryId);
  return [...staticInGlossary, ...runtimeInGlossary];
}

function InlineDefinition({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };
  if (editing) {
    return (
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          onSave(draft.trim());
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
            e.currentTarget.blur();
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.currentTarget.blur();
          }
        }}
        autoFocus
        rows={2}
        placeholder="Add or edit description…"
        className={styles.inlineEditInput}
      />
    );
  }
  const display = value.trim().length === 0 ? '' : value.length > 100 ? `${value.slice(0, 100)}…` : value;
  return (
    <button
      type="button"
      onClick={startEdit}
      className={styles.inlineEditTrigger}
      title={value || 'Click to add or edit description'}
    >
      {display || 'Add description…'}
    </button>
  );
}

function InlineTagDropdown({
  value,
  onSave,
  customTags,
  tagCategories,
  tagCategoryByTagName,
}: {
  value: string[];
  onSave: (v: string[]) => void;
  customTags: string[];
  tagCategories: Array<{ id: string; name: string }>;
  tagCategoryByTagName: Record<string, string>;
}) {
  const addTag = (tag: string) => {
    if (!tag || value.includes(tag)) return;
    onSave([...value, tag]);
  };
  const removeItem = (item: string) => {
    onSave(value.filter((x) => x !== item));
  };
  const available = customTags.filter((t) => !value.includes(t));
  return (
    <div className={styles.chipList}>
      <div className={styles.chipListChips}>
        {value.map((item) => (
          <span key={item} className={styles.chip}>
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className={styles.chipRemove}
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {customTags.length > 0 && (
        <div style={{ marginTop: 'var(--space-1)' }}>
          <select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) {
                addTag(v);
                e.currentTarget.value = '';
              }
            }}
            className={styles.inlineEditSelect}
          >
            <option value="">Add tag…</option>
            {available.length === 0 ? (
              <option value="">All tags applied</option>
            ) : (
              <>
                {available.filter((t) => !tagCategoryByTagName[t]).length > 0 && (
                  <optgroup label="Uncategorized">
                    {available.filter((t) => !tagCategoryByTagName[t]).map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </optgroup>
                )}
                {tagCategories.map((cat) => {
                  const tags = available.filter((t) => tagCategoryByTagName[t] === cat.id);
                  if (tags.length === 0) return null;
                  return (
                    <optgroup key={cat.id} label={cat.name}>
                      {tags.map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </>
            )}
          </select>
        </div>
      )}
    </div>
  );
}

function InlineChipList({
  value,
  placeholder,
  onSave,
}: {
  value: string[];
  placeholder: string;
  onSave: (v: string[]) => void;
}) {
  const [addInput, setAddInput] = useState('');
  const addItem = () => {
    const trimmed = addInput.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setAddInput('');
      return;
    }
    onSave([...value, trimmed]);
    setAddInput('');
  };
  const removeItem = (item: string) => {
    onSave(value.filter((x) => x !== item));
  };
  return (
    <div className={styles.chipList}>
      <div className={styles.chipListChips}>
        {value.map((item) => (
          <span key={item} className={styles.chip}>
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className={styles.chipRemove}
              aria-label={`Remove ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className={styles.chipListAdd}>
        <input
          type="text"
          value={addInput}
          onChange={(e) => setAddInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
          placeholder={placeholder}
          className={styles.inlineEditInput}
        />
        <button type="button" onClick={addItem} className={styles.chipAddBtn}>
          Add
        </button>
      </div>
    </div>
  );
}

export function GlossaryDetailPage() {
  const { glossaryId } = useParams();
  const runtimeTerms = useAppStore((s) => s.glossaryTerms);
  const runtimeGlossaries = useAppStore((s) => s.runtimeGlossaries);
  const glossaryTermOverrides = useAppStore((s) => s.glossaryTermOverrides);
  const setGlossaryTermOverride = useAppStore((s) => s.setGlossaryTermOverride);
  const customTags = useAppStore((s) => s.customTags);
  const tagCategories = useAppStore((s) => s.tagCategories);
  const tagCategoryByTagName = useAppStore((s) => s.tagCategoryByTagName);
  const allGlossaries = [...staticGlossaries, ...runtimeGlossaries];
  const glossary = glossaryId ? allGlossaries.find((g) => g.id === glossaryId) ?? null : null;
  const rawTerms = glossary ? getTermsForGlossary(glossary.id, runtimeTerms) : [];
  const terms = useMemo(
    () =>
      rawTerms.map((t) => {
        const o = glossaryTermOverrides[t.id];
        if (!o) return t;
        return {
          ...t,
          tags: o.tags ?? t.tags,
          synonyms: o.synonyms ?? t.synonyms,
          definition: o.definition ?? t.definition,
        };
      }),
    [rawTerms, glossaryTermOverrides]
  );
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(terms.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTerms = terms.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => {
    setPage(1);
  }, [glossaryId]);

  const impactedAssetIds = glossary ? getImpactedAssetIdsForGlossary(glossary.id) : [];
  const impactedAssets = impactedAssetIds
    .map((id) => assets.find((a) => a.id === id))
    .filter(Boolean) as NonNullable<ReturnType<typeof assets.find>>[];
  const location = useLocation();
  const termCount = (id: string) =>
    staticTerms.filter((t) => t.glossaryId === id).length + runtimeTerms.filter((t) => t.glossaryId === id).length;

  const leftPane = (
    <aside className={styles.glossarySidebar}>
      <h2 className={styles.glossarySidebarTitle}>Glossary groups</h2>
      <ul className={styles.resultList}>
        {allGlossaries.map((g) => {
          const isActive = location.pathname === `/glossary/glossary/${g.id}`;
          return (
            <li key={g.id}>
              <Link
                to={`/glossary/glossary/${g.id}`}
                className={styles.resultLink}
                style={isActive ? { background: 'var(--color-bg-elevated)', fontWeight: 'var(--font-semibold)' } : undefined}
              >
                <span className={styles.resultName}>{g.name}</span>
                <span className={styles.resultMeta}>{termCount(g.id)} terms</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link to="/glossary/new" className={styles.glossaryAddLink}>
        + Add glossary
      </Link>
    </aside>
  );

  if (!glossary) {
    return (
      <div className={styles.page}>
        <div className={styles.glossaryLayout}>
          {leftPane}
          <main className={styles.glossaryMain}>
            <p>Glossary not found.</p>
            <Link to="/glossary">← Glossaries</Link>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.glossaryLayout}>
        {leftPane}
        <main className={styles.glossaryMain}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/glossary" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Glossaries
        </Link>
      </div>
      <h1 className={styles.title} style={{ marginBottom: 'var(--space-2)' }}>{glossary.name}</h1>
          <p className={styles.muted} style={{ marginBottom: 'var(--space-2)' }}>{glossary.description}</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
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

          <Card>
            <CardHeader title="Terms" />
            <p className={styles.muted}>Click description to add or edit. Add/remove synonyms and tags with the controls in each cell.</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Term</th>
                    <th>Definition</th>
                    <th>Tags</th>
                    <th>Synonyms</th>
                    <th>Owner</th>
                    <th>Linked</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTerms.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <Link to={`/glossary/term/${t.id}`}>{t.name}</Link>
                      </td>
                      <td style={{ maxWidth: 280 }}>
                        <InlineDefinition
                          value={t.definition}
                          onSave={(v) => setGlossaryTermOverride(t.id, { definition: v })}
                        />
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <InlineTagDropdown
                          value={t.tags}
                          onSave={(v) => setGlossaryTermOverride(t.id, { tags: v })}
                          customTags={customTags}
                          tagCategories={tagCategories}
                          tagCategoryByTagName={tagCategoryByTagName}
                        />
                      </td>
                      <td style={{ maxWidth: 200 }}>
                        <InlineChipList
                          value={t.synonyms}
                          placeholder="Add synonym…"
                          onSave={(v) => setGlossaryTermOverride(t.id, { synonyms: v })}
                        />
                      </td>
                      <td>{t.owner}</td>
                      <td>{t.linkedColumnIds.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {terms.length > PAGE_SIZE && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span className={styles.paginationInfo}>
                  Page {currentPage} of {totalPages} ({terms.length} terms)
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
          </Card>

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
        </main>
      </div>
    </div>
  );
}
