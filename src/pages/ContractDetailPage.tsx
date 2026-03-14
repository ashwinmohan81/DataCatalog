import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getContractById,
  getAssetById,
  getApplicationById,
  dqRules,
} from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  approved: 'success',
  pending_approval: 'warning',
  rejected: 'error',
  draft: 'default',
};

export function ContractDetailPage() {
  const { contractId } = useParams();
  const fromStore = useAppStore((s) => s.contractRequests.find((c) => c.id === contractId));
  const fromStatic = contractId ? getContractById(contractId) : null;
  const contract = fromStore ?? fromStatic;
  const setContractStatus = useAppStore((s) => s.setContractStatus);
  const [rejectReason, setRejectReason] = useState('');
  const asset = contract ? getAssetById(contract.assetId) : null;
  const requesterApp = contract?.requestedByApplicationId ? getApplicationById(contract.requestedByApplicationId) : null;
  const approverApp = contract?.approvedByApplicationId ? getApplicationById(contract.approvedByApplicationId) : null;

  if (!contract) {
    return (
      <div className={styles.page}>
        <p>Contract not found.</p>
        <Link to="/contracts">← Contracts</Link>
      </div>
    );
  }

  const contractDqRules = (contract.dqRuleIds ?? []).map((id) => dqRules.find((r) => r.id === id)).filter(Boolean) as typeof dqRules;

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/contracts" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Contracts
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
        <h1 className={styles.title} style={{ margin: 0 }}>{contract.name}</h1>
        <Badge variant={statusVariant[contract.status] ?? 'default'}>{contract.status.replace('_', ' ')}</Badge>
        <Badge variant="info">v{contract.version}</Badge>
      </div>
      <p className={styles.muted}>
        Asset: {asset ? <Link to={`/asset/${contract.assetId}`}>{asset.displayName}</Link> : contract.assetId}
        {' · '}Created by {contract.createdBy} · {new Date(contract.createdAt).toLocaleString()}
        {requesterApp && ` · Requested by: ${requesterApp.name}`}
        {contract.status === 'approved' && approverApp && ` · Approved by: ${approverApp.name}`}
        {contract.approvedAt && ` · ${new Date(contract.approvedAt).toLocaleString()}`}
        {contract.rejectedReason && ` · Rejected: ${contract.rejectedReason}`}
      </p>

      {/* SLAs */}
      <div style={{ marginBottom: 'var(--space-4)' }}><Card>
        <CardHeader title="SLAs" />
        {contract.slas && contract.slas.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Target</th>
                  {contract.slas.some((s) => s.unit) && <th>Unit</th>}
                </tr>
              </thead>
              <tbody>
                {contract.slas.map((sla, i) => (
                  <tr key={i}>
                    <td>{sla.type}</td>
                    <td>{sla.target}</td>
                    {contract.slas!.some((s) => s.unit) && <td>{sla.unit ?? '—'}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : contract.slo ? (
          <p className={styles.muted}>{contract.slo}</p>
        ) : (
          <p className={styles.muted}>No SLAs defined.</p>
        )}
      </Card></div>

      {/* Schema */}
      <div style={{ marginBottom: 'var(--space-4)' }}><Card>
        <CardHeader title="Schema" action={<Badge variant="default">{contract.schema.length} attributes</Badge>} />
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Attribute</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {contract.schema.map((attr) => (
                <tr key={attr.id}>
                  <td>{attr.name}</td>
                  <td>{attr.type}</td>
                  <td>{attr.required ? 'Yes' : 'No'}</td>
                  <td className={styles.muted}>{attr.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card></div>

      {/* DQ rules */}
      <div style={{ marginBottom: 'var(--space-4)' }}><Card>
        <CardHeader title="Data quality rules" />
        {contractDqRules.length > 0 ? (
          <ul className={styles.resultList}>
            {contractDqRules.map((r) => (
              <li key={r.id}>
                <Link to={`/asset/${r.assetId}#dq`} className={styles.resultLink}>
                  <span className={styles.resultName}>{r.name}</span>
                  <span className={styles.resultMeta}>{r.type} · Last run: {r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : '—'} {r.lastRunPassed != null && (r.lastRunPassed ? '✓ Passed' : '✗ Failed')}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No DQ rules linked to this contract.</p>
        )}
      </Card></div>

      {/* Version history */}
      <Card>
        <CardHeader title="Version history" />
        {contract.versionHistory && contract.versionHistory.length > 0 ? (
          <ul className={styles.resultList}>
            {[...contract.versionHistory].reverse().map((v, i) => (
              <li key={i}>
                <div style={{ padding: 'var(--space-3)' }}>
                  <strong>v{v.version}</strong>
                  <span className={styles.muted} style={{ marginLeft: 'var(--space-2)' }}>
                    {new Date(v.at).toLocaleString()} · {v.by}
                  </span>
                  <p style={{ margin: 'var(--space-1) 0 0' }}>{v.changeSummary}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.muted}>No version history.</p>
        )}
      </Card>

      {contract.status === 'approved' && (
        <p style={{ marginTop: 'var(--space-4)' }}>
          <Link to={`/contracts/consume/${contract.id}`}>Consume this contract →</Link>
        </p>
      )}

      {contract.status === 'pending_approval' && asset?.applicationId && (
        <div style={{ marginTop: 'var(--space-4)' }}><Card>
          <CardHeader title="Producer approval" />
          <p className={styles.muted}>You own this asset. Approve or reject the contract request.</p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={() =>
                setContractStatus(contract.id, 'approved', {
                  approvedByApplicationId: asset!.applicationId!,
                  approvedAt: new Date().toISOString(),
                })
              }
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--color-success)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius)',
              }}
            >
              Approve
            </button>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Rejection reason (optional)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ padding: 'var(--space-2)', minWidth: 200 }}
              />
              <button
                type="button"
                onClick={() =>
                  setContractStatus(contract.id, 'rejected', {
                    rejectedReason: rejectReason || 'Rejected by producer',
                  })
                }
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  background: 'var(--color-error, #c00)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                }}
              >
                Reject
              </button>
            </div>
          </div>
        </Card></div>
      )}
    </div>
  );
}
