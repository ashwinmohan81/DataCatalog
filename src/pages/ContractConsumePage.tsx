import { useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getContractById, assets, dqRules } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

export function ContractConsumePage() {
  const { contractId } = useParams();
  const location = useLocation();
  const fromStore = useAppStore((s) => s.contractRequests.find((c) => c.id === contractId));
  const fromStatic = contractId ? getContractById(contractId) : null;
  const contract = fromStore ?? fromStatic;
  const runtimeDqRules = useAppStore((s) => s.runtimeDqRules);
  const [selected, setSelected] = useState<Set<string>>(new Set(contract?.schema.map((a) => a.id) ?? []));
  const initialDqIds = (location.state as { selectedDqRuleIds?: string[] } | null)?.selectedDqRuleIds ?? contract?.dqRuleIds ?? [];
  const [selectedDqRuleIds, setSelectedDqRuleIds] = useState<string[]>(Array.isArray(initialDqIds) ? initialDqIds : []);
  const [consumerApplicationName, setConsumerApplicationName] = useState('');
  const [purposeOfUsage, setPurposeOfUsage] = useState('');
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
  const assetDqRules = asset
    ? [...dqRules.filter((r) => r.assetId === asset.id), ...runtimeDqRules.filter((r) => r.assetId === asset.id)]
    : [];
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleDq = (id: string) =>
    setSelectedDqRuleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

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
        <CardHeader title="Consumer details" />
        <p className={styles.muted}>Provide your application name and purpose of usage for this onboarding.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 480, marginTop: 'var(--space-3)' }}>
          <div>
            <label className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Consumer application name</label>
            <input
              type="text"
              value={consumerApplicationName}
              onChange={(e) => setConsumerApplicationName(e.target.value)}
              placeholder="e.g. BCBS Reporting App"
              style={{ width: '100%', padding: 'var(--space-2)' }}
            />
          </div>
          <div>
            <label className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Purpose of usage</label>
            <textarea
              value={purposeOfUsage}
              onChange={(e) => setPurposeOfUsage(e.target.value)}
              placeholder="e.g. Regulatory exposure reporting for BCBS 239"
              rows={3}
              style={{ width: '100%', padding: 'var(--space-2)' }}
            />
          </div>
        </div>
      </Card>

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
      </Card>

      {assetDqRules.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
        <Card>
          <CardHeader title="Fit-for-purpose DQ checks (optional)" />
          <p className={styles.muted}>Select which data quality checks you want enabled for your consumption.</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--space-2) 0 0' }}>
            {assetDqRules.map((r) => (
              <li key={r.id} style={{ marginBottom: 'var(--space-1)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    type="checkbox"
                    checked={selectedDqRuleIds.includes(r.id)}
                    onChange={() => toggleDq(r.id)}
                  />
                  {r.name} ({r.type})
                </label>
              </li>
            ))}
          </ul>
        </Card>
        </div>
      )}

      <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setRequested(true)}
          disabled={!consumerApplicationName.trim()}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: consumerApplicationName.trim() ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
            color: consumerApplicationName.trim() ? 'white' : 'var(--color-text-muted)',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: consumerApplicationName.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Request access & get snapshot
        </button>
      </div>
      {requested && (
        <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-success)' }}>
          Access requested for <strong>{consumerApplicationName.trim() || '—'}</strong>
          {purposeOfUsage.trim() ? ` (${purposeOfUsage.trim().slice(0, 60)}${purposeOfUsage.trim().length > 60 ? '…' : ''})` : ''}. You selected {selected.size} attribute(s)
          {selectedDqRuleIds.length > 0 ? ` and ${selectedDqRuleIds.length} DQ check(s)` : ''}. Mock: snapshot would be generated.
        </p>
      )}
    </div>
  );
}
