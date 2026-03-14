import { connectors } from '../data/mock';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

export function ConnectorsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Connectors</h1>
      <p className={styles.muted}>Data source connections and scan schedules.</p>

      <Card>
        <CardHeader
          title="Connections"
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
              Add connection
            </button>
          }
        />
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last scan</th>
                <th>Schedule</th>
              </tr>
            </thead>
            <tbody>
              {connectors.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.type}</td>
                  <td>
                    <Badge variant={c.status === 'active' ? 'success' : 'error'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td>{c.lastScanAt ? new Date(c.lastScanAt).toLocaleString() : '—'}</td>
                  <td><code>{c.schedule ?? '—'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
