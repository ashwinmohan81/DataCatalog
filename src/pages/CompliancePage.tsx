import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

const BCBS_SECTIONS = [
  { id: 'gov', title: 'Governance', desc: 'Board and senior management oversight', capability: 'Glossary, ownership, stewardship, workflows', path: '/glossary' },
  { id: 'arch', title: 'Data architecture & IT', desc: 'Architecture supports aggregation and reporting', capability: 'Lineage, logical/physical mapping, domains', path: '/catalog' },
  { id: 'accuracy', title: 'Accuracy & integrity', desc: 'Largely automated, minimal manual error', capability: 'DQ rules, profiling, versioning', path: '/quality' },
  { id: 'completeness', title: 'Completeness', desc: 'All material risk data', capability: 'Domains, data products, coverage', path: '/marketplace' },
  { id: 'timeliness', title: 'Timeliness', desc: 'Data available when needed', capability: 'Last scan, refresh metadata', path: '/settings/connectors' },
  { id: 'reporting', title: 'Risk reporting', desc: 'Accurate, comprehensive, clear', capability: 'Glossary, DQ, export for compliance', path: '/insights' },
];

export function CompliancePage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Compliance (BCBS 239)</h1>
      <p className={styles.muted}>Principle-to-capability mapping and evidence placeholders.</p>

      <Card>
        <CardHeader
          title="Export for compliance"
          action={
            <button
              type="button"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
              }}
            >
              Export for compliance
            </button>
          }
        />
        <p className={styles.muted}>
          Mock: generates a snapshot of lineage, DQ summary, glossary coverage, ownership, and last scan dates for BCBS 239–relevant assets.
        </p>
      </Card>

      <Card>
        <CardHeader title="Principles → Catalog capability" />
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {BCBS_SECTIONS.map((s) => (
            <li key={s.id} style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-border)' }}>
              <strong>{s.title}</strong>
              <p className={styles.muted} style={{ margin: 'var(--space-1) 0' }}>{s.desc}</p>
              <p style={{ fontSize: 'var(--text-sm)' }}>
                Catalog: <Link to={s.path}>{s.capability}</Link>
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
