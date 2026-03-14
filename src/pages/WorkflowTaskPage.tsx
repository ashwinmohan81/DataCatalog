import { useParams, Link } from 'react-router-dom';
import { workflowTasks } from '../data/mock';
import styles from './Page.module.css';

export function WorkflowTaskPage() {
  const { taskId } = useParams();
  const task = taskId ? workflowTasks.find((t) => t.id === taskId) : null;

  if (!task) {
    return (
      <div className={styles.page}>
        <p>Task not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/workflows" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Workflows
        </Link>
      </div>
      <h1 className={styles.title} style={{ marginBottom: 'var(--space-2)' }}>{task.title}</h1>
      <p style={{ textTransform: 'capitalize', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        Status: {task.status.replace('_', ' ')}
      </p>
      <p style={{ marginBottom: 'var(--space-4)' }}>{task.description}</p>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--space-2) var(--space-4)' }}>
        <dt>Asset</dt>
        <dd><Link to={`/asset/${task.assetId}`}>{task.assetName}</Link></dd>
        <dt>Requested by</dt>
        <dd>{task.requestedBy}</dd>
        <dt>Assigned to</dt>
        <dd>{task.assignedTo}</dd>
        <dt>Created</dt>
        <dd>{new Date(task.createdAt).toLocaleString()}</dd>
        <dt>Updated</dt>
        <dd>{new Date(task.updatedAt).toLocaleString()}</dd>
      </dl>
    </div>
  );
}
