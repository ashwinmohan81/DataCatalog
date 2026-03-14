import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.muted}>Configure connectors and other catalog settings.</p>

      <Link to="/settings/connectors" style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card>
          <CardHeader title="Connectors" />
          <p className={styles.muted}>Data source connections and scan schedules.</p>
        </Card>
      </Link>
    </div>
  );
}
