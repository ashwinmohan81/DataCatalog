import { Link } from 'react-router-dom';
import { dataContracts, assets } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  approved: 'success',
  pending_approval: 'warning',
  rejected: 'error',
  draft: 'default',
};

export function ContractsPage() {
  const contractRequests = useAppStore((s) => s.contractRequests);
  const contractAmendmentRequests = useAppStore((s) => s.contractAmendmentRequests);
  const allContracts = [
    ...dataContracts,
    ...contractRequests.filter((r) => !dataContracts.some((c) => c.id === r.id)),
  ];
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Data contracts</h1>
      <p className={styles.muted}>Producer-published contracts. Consumers request new contracts; producers approve.</p>
      <p style={{ marginBottom: 'var(--space-4)' }}>
        <Link
          to="/contracts/request"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: 'var(--radius)',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Request new contract
        </Link>
      </p>
      <ul className={styles.resultList}>
        {allContracts.map((c) => {
          const asset = assets.find((a) => a.id === c.assetId);
          const hasPendingAmendment = contractAmendmentRequests.some(
            (a) => a.contractId === c.id && a.status === 'pending_consumer_approval'
          );
          return (
            <li key={c.id}>
              <Card>
                <CardHeader
                  title={c.name}
                  action={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {hasPendingAmendment && <Badge variant="warning">Amendment pending</Badge>}
                      <Badge variant={statusVariant[c.status] ?? 'default'}>{c.status.replace('_', ' ')}</Badge>
                      <Link to={`/contracts/${c.id}`}>View</Link>
                      {c.status === 'approved' && <Link to={`/contracts/consume/${c.id}`}>Consume →</Link>}
                    </span>
                  }
                />
                <p className={styles.muted}>
                  Asset: {asset ? <Link to={`/asset/${c.assetId}`}>{asset.displayName}</Link> : c.assetId}
                </p>
                <p style={{ fontSize: 'var(--text-sm)' }}>
                  v{c.version} · {c.createdBy} · {new Date(c.createdAt).toLocaleDateString()}
                  {(c.slas?.length ? c.slas.map((s) => s.target).join('; ') : c.slo) && ` · ${c.slas?.length ? c.slas.map((s) => s.target).join('; ') : c.slo}`}
                </p>
                <Badge variant="info">{c.schema.length} attributes</Badge>
                {c.dqRuleIds && c.dqRuleIds.length > 0 && <span style={{ marginLeft: 'var(--space-2)' }}><Badge variant="default">{c.dqRuleIds.length} DQ rules</Badge></span>}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
