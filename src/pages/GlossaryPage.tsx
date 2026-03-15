import { Link, useLocation } from 'react-router-dom';
import { glossaries, glossaryTerms as staticTerms } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import styles from './Page.module.css';

export function GlossaryPage() {
  const location = useLocation();
  const runtimeGlossaries = useAppStore((s) => s.runtimeGlossaries);
  const runtimeTerms = useAppStore((s) => s.glossaryTerms);
  const allGlossaries = [...glossaries, ...runtimeGlossaries];
  const termCount = (id: string) =>
    staticTerms.filter((t) => t.glossaryId === id).length + runtimeTerms.filter((t) => t.glossaryId === id).length;

  return (
    <div className={styles.page}>
      <div className={styles.glossaryLayout}>
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

        <main className={styles.glossaryMain}>
          <h1 className={styles.title}>Glossary</h1>
          <p className={styles.muted}>Select a glossary from the left to view and edit terms.</p>
          {allGlossaries.length === 0 && (
            <p>
              <Link
                to="/glossary/new"
                style={{
                  display: 'inline-block',
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 'var(--radius)',
                  textDecoration: 'none',
                }}
              >
                Add glossary
              </Link>
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
