import { Link } from 'react-router-dom';
import { glossaries, glossaryTerms } from '../data/mock';
import styles from './Page.module.css';

export function GlossaryPage() {
  const termCountByGlossary = glossaries.map((g) => ({
    glossary: g,
    termCount: glossaryTerms.filter((t) => t.glossaryId === g.id).length,
  }));

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Glossaries</h1>
      <p className={styles.muted}>Multiple glossaries with terms linked to data assets. Add terms and link asset columns to terms.</p>
      <ul className={styles.resultList}>
        {termCountByGlossary.map(({ glossary, termCount }) => (
          <li key={glossary.id}>
            <Link to={`/glossary/glossary/${glossary.id}`} className={styles.resultLink}>
              <span className={styles.resultName}>{glossary.name}</span>
              <span className={styles.resultMeta}>
                {glossary.description} · {termCount} terms
                {glossary.linkedGlossaryIds.length > 0 && ` · Linked to ${glossary.linkedGlossaryIds.length} glossary(ies)`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
