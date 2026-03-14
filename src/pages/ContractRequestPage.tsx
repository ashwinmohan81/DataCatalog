import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ContractAttribute, ContractSLA } from '../data/mock/types';
import { assets, dqRules } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

const SLA_TYPES: ContractSLA['type'][] = ['freshness', 'availability', 'latency'];

export function ContractRequestPage() {
  const navigate = useNavigate();
  const addContractRequest = useAppStore((s) => s.addContractRequest);
  const [name, setName] = useState('');
  const [assetId, setAssetId] = useState('');
  const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(new Set());
  const [slas, setSlas] = useState<ContractSLA[]>([{ type: 'freshness', target: '' }]);
  const [dqRuleIds, setDqRuleIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const runtimeDqRules = useAppStore((s) => s.runtimeDqRules);
  const asset = assetId ? assets.find((a) => a.id === assetId) : null;
  const assetDqRules = asset
    ? [...dqRules.filter((r) => r.assetId === asset.id), ...runtimeDqRules.filter((r) => r.assetId === asset.id)]
    : [];

  const toggleColumn = (id: string) => {
    setSelectedColumnIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSla = () => setSlas((prev) => [...prev, { type: 'freshness', target: '' }]);
  const updateSla = (i: number, field: 'type' | 'target', value: string) => {
    setSlas((prev) => prev.map((s, j) => (j === i ? { ...s, [field]: value } : s)));
  };
  const removeSla = (i: number) => setSlas((prev) => prev.filter((_, j) => j !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !name || !asset) return;
    const schema: ContractAttribute[] = asset.columns
      .filter((c) => selectedColumnIds.has(c.id))
      .map((c) => ({
        id: `attr-${c.id}`,
        name: c.name,
        type: c.type,
        required: true,
      }));
    const validSlas = slas.filter((s) => s.target.trim());
    const id = `contract-request-${Date.now()}`;
    addContractRequest({
      id,
      name,
      assetId,
      version: 1,
      createdAt: new Date().toISOString(),
      createdBy: 'Consumer (you)',
      status: 'pending_approval',
      requestedByApplicationId: 'app-bcbs-consumer',
      schema,
      slas: validSlas.length > 0 ? validSlas : undefined,
      dqRuleIds: dqRuleIds.length > 0 ? dqRuleIds : undefined,
      versionHistory: [
        {
          version: 1,
          at: new Date().toISOString(),
          by: 'Consumer (you)',
          changeSummary: 'Contract request submitted for producer approval.',
        },
      ],
    });
    setSubmitted(true);
    setTimeout(() => navigate(`/contracts/${id}`), 1500);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Contract request submitted</h1>
        <p className={styles.muted}>The producer application will review and approve or reject. Redirecting to contract…</p>
        <Link to="/contracts">← Back to contracts</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/contracts" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Contracts
        </Link>
      </div>
      <h1 className={styles.title}>Request data contract</h1>
      <p className={styles.muted}>As a consumer, request a new contract. The producer application that owns the asset will approve or reject.</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--space-4)' }}><Card>
          <CardHeader title="Basic info" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 400 }}>
            <label>
              <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Contract name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Exposure Snapshot for Reporting"
                style={{ width: '100%', padding: 'var(--space-2)' }}
              />
            </label>
            <label>
              <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Data asset</span>
              <select
                value={assetId}
                onChange={(e) => {
                  setAssetId(e.target.value);
                  setSelectedColumnIds(new Set());
                  setDqRuleIds([]);
                }}
                required
                style={{ width: '100%', padding: 'var(--space-2)' }}
              >
                <option value="">Select asset…</option>
                {assets.filter((a) => a.type === 'table').map((a) => (
                  <option key={a.id} value={a.id}>{a.displayName}</option>
                ))}
              </select>
            </label>
          </div>
        </Card></div>

        {asset && (
          <>
            <div style={{ marginBottom: 'var(--space-4)' }}><Card>
              <CardHeader title="Schema (select columns to include)" />
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>Include</th>
                      <th>Column</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asset.columns.map((col) => (
                      <tr key={col.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedColumnIds.has(col.id)}
                            onChange={() => toggleColumn(col.id)}
                          />
                        </td>
                        <td>{col.name}</td>
                        <td>{col.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card></div>

            <div style={{ marginBottom: 'var(--space-4)' }}><Card>
              <CardHeader title="SLAs" />
              {slas.map((sla, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <select
                    value={sla.type}
                    onChange={(e) => updateSla(i, 'type', e.target.value)}
                    style={{ padding: 'var(--space-2)' }}
                  >
                    {SLA_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={sla.target}
                    onChange={(e) => updateSla(i, 'target', e.target.value)}
                    placeholder="e.g. Daily 06:00 UTC or 99.9%"
                    style={{ padding: 'var(--space-2)', minWidth: 200 }}
                  />
                  <button type="button" onClick={() => removeSla(i)} className={styles.muted} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={addSla} style={{ padding: 'var(--space-2)', marginTop: 'var(--space-2)' }}>+ Add SLA</button>
            </Card></div>

            {assetDqRules.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}><Card>
                <CardHeader title="Data quality rules (optional)" />
                <p className={styles.muted}>Select DQ rules that must be satisfied for this contract.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--space-2) 0 0' }}>
                  {assetDqRules.map((r) => (
                    <li key={r.id} style={{ marginBottom: 'var(--space-1)' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <input
                          type="checkbox"
                          checked={dqRuleIds.includes(r.id)}
                          onChange={(e) => setDqRuleIds((prev) => e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id))}
                        />
                        {r.name} ({r.type})
                      </label>
                    </li>
                  ))}
                </ul>
              </Card></div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={!assetId || !name || selectedColumnIds.size === 0}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: !assetId || !name || selectedColumnIds.size === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Submit for producer approval
        </button>
      </form>
    </div>
  );
}
