import { Link } from 'react-router-dom';
import { dqRules, dqRuns, assets } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

export function DataQualityPage() {
  const runtimeDqRules = useAppStore((s) => s.runtimeDqRules);
  const allDqRules = [...dqRules, ...runtimeDqRules];
  const getDqRuleById = (id: string) => dqRules.find((r) => r.id === id) ?? runtimeDqRules.find((r) => r.id === id);
  const failedRuns = dqRuns.filter((r) => !r.passed);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Data quality</h1>
      <p className={styles.muted}>Rules, run history, and self-service DQ.</p>

      <Card>
        <CardHeader title="Recent failures" />
        {failedRuns.length === 0 ? (
          <p className={styles.muted}>No recent failures.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Asset</th>
                  <th>Run at</th>
                  <th>Failed count</th>
                </tr>
              </thead>
              <tbody>
                {failedRuns.map((r) => (
                  <tr key={r.id}>
                    <td>{getDqRuleById(r.ruleId)?.name ?? r.ruleId}</td>
                    <td>
                      {assets.find((a) => a.id === r.assetId) ? (
                        <Link to={`/asset/${r.assetId}`}>{assets.find((a) => a.id === r.assetId)!.displayName}</Link>
                      ) : r.assetId}
                    </td>
                    <td>{new Date(r.runAt).toLocaleString()}</td>
                    <td><Badge variant="error">{r.failedCount ?? '—'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="All rules" />
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Type</th>
                <th>Asset</th>
                <th>Last run</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {allDqRules.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>
                    <Link to={`/asset/${r.assetId}`}>
                      {assets.find((a) => a.id === r.assetId)?.displayName ?? r.assetId}
                    </Link>
                  </td>
                  <td>{r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : '—'}</td>
                  <td>
                    {r.lastRunPassed === true ? <Badge variant="success">Passed</Badge> : r.lastRunPassed === false ? <Badge variant="error">Failed</Badge> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
