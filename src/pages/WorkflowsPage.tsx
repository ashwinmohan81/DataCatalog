import { Link } from 'react-router-dom';
import { workflowTasks } from '../data/mock';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

export function WorkflowsPage() {
  const open = workflowTasks.filter((t) => t.status === 'open' || t.status === 'in_progress');
  const done = workflowTasks.filter((t) => t.status === 'done');

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Workflows</h1>
      <p className={styles.muted}>Change requests and tasks assigned to you.</p>

      <Card>
        <CardHeader title="Open / In progress" />
        {open.length === 0 ? (
          <p className={styles.muted}>No open tasks.</p>
        ) : (
          <ul className={styles.resultList}>
            {open.map((t) => (
              <li key={t.id}>
                <Link to={`/workflows/task/${t.id}`} className={styles.resultLink}>
                  <span className={styles.resultName}>{t.title}</span>
                  <span className={styles.resultMeta}>{t.assetName} · Assigned to {t.assignedTo}</span>
                  <span style={{ marginTop: 'var(--space-1)', display: 'flex', gap: 'var(--space-2)' }}>
                    <Badge variant={t.status === 'in_progress' ? 'warning' : 'default'}>{t.status.replace('_', ' ')}</Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Done" />
        {done.length === 0 ? (
          <p className={styles.muted}>No completed tasks.</p>
        ) : (
          <ul className={styles.resultList}>
            {done.map((t) => (
              <li key={t.id}>
                <Link to={`/workflows/task/${t.id}`} className={styles.resultLink}>
                  <span className={styles.resultName}>{t.title}</span>
                  <span className={styles.resultMeta}>{t.assetName}</span>
                  <Badge variant="success">Done</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
