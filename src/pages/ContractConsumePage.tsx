import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getContractById, assets } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

export function ContractConsumePage() {
  const { contractId } = useParams();
  const fromStore = useAppStore((s) => s.contractRequests.find((c) => c.id === contractId));
  const fromStatic = contractId ? getContractById(contractId) : null;
  const contract = fromStore ?? fromStatic;
  const [selected, setSelected] = useState<Set<string>>(new Set(contract?.schema.map((a) => a.id) ?? []));
  const [requested, setRequested] = useState(false);

  if (!contract) {
    return (
      <div className={styles.page}>
        <p>Contract not found.</p>
        <Link to="/contracts">← Contracts</Link>
      </div>
    );
  }

  if (contract.status !== 'approved') {
    return (
      <div className={styles.page}>
        <p>This contract is not yet approved for consumption. Status: {contract.status.replace('_', ' ')}.</p>
        <Link to={`/contracts/${contract.id}`}>View contract</Link>
      </div>
    );
  }

  const asset = assets.find((a) => a.id === contract.assetId);
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/contracts" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Contracts
        </Link>
      </div>
      <h1 className={styles.title}>Consume: {contract.name}</h1>
      <p className={styles.muted}>
        Asset: {asset ? <Link to={`/asset/${contract.assetId}`}>{asset.displayName}</Link> : contract.assetId}
      </p>

      <Card>
        <CardHeader title="Select attributes" />
        <p className={styles.muted}>Pick the attributes you need for your consumption. Request access if required.</p>
        <div className={styles.tableWrap} style={{ marginTop: 'var(--space-3)' }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: 48 }}>Select</th>
                <th>Attribute</th>
                <th>Type</th>
                <th>Required</th>
              </tr>
            </thead>
            <tbody>
              {contract.schema.map((attr) => (
                <tr key={attr.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(attr.id)}
                      onChange={() => toggle(attr.id)}
                    />
                  </td>
                  <td>{attr.name}</td>
                  <td>{attr.type}</td>
                  <td>{attr.required ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={() => setRequested(true)}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
            }}
          >
            Request access & get snapshot
          </button>
        </div>
        {requested && (
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-success)' }}>
            Access requested. You selected {selected.size} attribute(s). Mock: snapshot would be generated.
          </p>
        )}
      </Card>
    </div>
  );
}
