import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dqRules, dqRuns, dqRuleTemplates, assets } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { getRuleDimension, DQ_DIMENSION_IDS, DQ_DIMENSION_LABELS } from '../utils/dqDimensions';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

const getTemplate = (id: string) => dqRuleTemplates.find((t) => t.id === id);

export function DataQualityPage() {
  const [dimensionFilter, setDimensionFilter] = useState<string>('');
  const runtimeDqRules = useAppStore((s) => s.runtimeDqRules);
  const allDqRulesRaw = [...dqRules, ...runtimeDqRules];
  const allDqRules = dimensionFilter
    ? allDqRulesRaw.filter((r) => getRuleDimension(r, getTemplate) === dimensionFilter)
    : allDqRulesRaw;
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
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <label className={styles.muted} style={{ marginRight: 'var(--space-2)' }}>Filter by DQ dimension:</label>
          <select
            value={dimensionFilter}
            onChange={(e) => setDimensionFilter(e.target.value)}
            style={{ padding: 'var(--space-2)', minWidth: 180 }}
            aria-label="DQ dimension filter"
          >
            <option value="">All dimensions</option>
            {DQ_DIMENSION_IDS.map((dim) => (
              <option key={dim} value={dim}>{DQ_DIMENSION_LABELS[dim]}</option>
            ))}
          </select>
          {dimensionFilter && (
            <span className={styles.muted} style={{ marginLeft: 'var(--space-2)' }}>
              Showing {allDqRules.length} of {allDqRulesRaw.length} rules
            </span>
          )}
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Dimension</th>
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
                  <td><Badge variant="default">{DQ_DIMENSION_LABELS[getRuleDimension(r, getTemplate)]}</Badge></td>
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
