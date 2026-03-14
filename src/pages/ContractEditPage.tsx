import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ContractAttribute, ContractSLA } from '../data/mock/types';
import { getContractById, getAssetById, dqRules } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

const SLA_TYPES: ContractSLA['type'][] = ['freshness', 'availability', 'latency'];

export function ContractEditPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const fromStore = useAppStore((s) => s.contractRequests.find((c) => c.id === contractId));
  const fromStatic = contractId ? getContractById(contractId) : null;
  const contract = fromStore ?? fromStatic;
  const updateContract = useAppStore((s) => s.updateContract);
  const addContractAmendmentRequest = useAppStore((s) => s.addContractAmendmentRequest);
  const ensureContractInStore = useAppStore((s) => s.ensureContractInStore);
  const contractAmendmentRequests = useAppStore((s) => s.contractAmendmentRequests);
  const runtimeDqRules = useAppStore((s) => s.runtimeDqRules);

  useEffect(() => {
    if (contract && !fromStore) ensureContractInStore(contract);
  }, [contract, fromStore, ensureContractInStore]);

  const asset = contract ? getAssetById(contract.assetId) : null;
  const assetDqRules = asset
    ? [...dqRules.filter((r) => r.assetId === asset.id), ...runtimeDqRules.filter((r) => r.assetId === asset.id)]
    : [];

  const initialSelectedColumnIds = useMemo(() => {
    if (!contract?.schema || !asset) return new Set<string>();
    return new Set(
      contract.schema.map((a) => (a.id.startsWith('attr-') ? a.id.slice(5) : a.id))
    );
  }, [contract?.id]);
  const [name, setName] = useState(contract?.name ?? '');
  const [selectedColumnIds, setSelectedColumnIds] = useState<Set<string>>(initialSelectedColumnIds);
  const [slas, setSlas] = useState<ContractSLA[]>(
    contract?.slas && contract.slas.length > 0 ? contract.slas : [{ type: 'freshness', target: '' }]
  );
  const [dqRuleIds, setDqRuleIds] = useState<string[]>(contract?.dqRuleIds ?? []);
  const [submitted, setSubmitted] = useState(false);
  const [amendmentMessage, setAmendmentMessage] = useState(false);

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

  const hasConsumer = Boolean(
    contract?.status === 'approved' && contract?.requestedByApplicationId
  );
  const hasPendingAmendment = contract
    ? contractAmendmentRequests.some(
        (a) => a.contractId === contract.id && a.status === 'pending_consumer_approval'
      )
    : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId || !contract || !asset || !name || selectedColumnIds.size === 0) return;
    const schema: ContractAttribute[] = asset.columns
      .filter((c) => selectedColumnIds.has(c.id))
      .map((c) => ({
        id: `attr-${c.id}`,
        name: c.name,
        type: c.type,
        description: c.description,
        required: true,
      }));
    const validSlas = slas.filter((s) => s.target.trim());
    const proposed = {
      name,
      schema,
      slas: validSlas.length > 0 ? validSlas : undefined,
      dqRuleIds: dqRuleIds.length > 0 ? dqRuleIds : undefined,
    };

    if (!hasConsumer) {
      const nextVersion = contract.version + 1;
      const now = new Date().toISOString();
      updateContract(contractId, {
        name,
        schema,
        slas: proposed.slas,
        dqRuleIds: proposed.dqRuleIds,
        version: nextVersion,
        versionHistory: [
          ...(contract.versionHistory ?? []),
          {
            version: nextVersion,
            at: now,
            by: 'Producer',
            changeSummary: 'Contract updated (no consumer; applied immediately).',
          },
        ],
      });
      setSubmitted(true);
      setTimeout(() => navigate(`/contracts/${contractId}`), 1000);
    } else {
      addContractAmendmentRequest(contractId, proposed, contract.name);
      setAmendmentMessage(true);
      setTimeout(() => navigate(`/contracts/${contractId}`), 2000);
    }
  };

  if (!contract) {
    return (
      <div className={styles.page}>
        <p>Contract not found.</p>
        <Link to="/contracts">← Contracts</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Contract updated</h1>
        <p className={styles.muted}>Redirecting to contract…</p>
        <Link to="/contracts">← Back to contracts</Link>
      </div>
    );
  }

  if (amendmentMessage) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Amendment submitted</h1>
        <p className={styles.muted}>The consumer will be notified and must approve before changes take effect. Redirecting to contract…</p>
        <Link to="/contracts">← Back to contracts</Link>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className={styles.page}>
        <p>Asset not found for this contract.</p>
        <Link to={`/contracts/${contractId}`}>← Back to contract</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to={`/contracts/${contractId}`} style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Contract: {contract.name}
        </Link>
      </div>
      <h1 className={styles.title}>Edit contract</h1>
      <p className={styles.muted}>
        {hasConsumer
          ? 'This contract has a consumer. Changes will be submitted as an amendment and require consumer approval.'
          : 'Update contract details. Changes apply immediately.'}
      </p>
      {hasPendingAmendment && (
        <p className={styles.muted} style={{ color: 'var(--color-warning)' }}>
          There is already a pending amendment for this contract. You can still submit a new amendment (it will create another request).
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
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
              <p className={styles.muted}>Asset: {asset.displayName} (fixed)</p>
            </div>
          </Card>
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
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
          </Card>
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
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
          </Card>
        </div>

        {assetDqRules.length > 0 && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <Card>
              <CardHeader title="Data quality rules (optional)" />
              <p className={styles.muted}>Select DQ rules that must be satisfied for this contract.</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--space-2) 0 0' }}>
                {assetDqRules.map((r) => (
                  <li key={r.id} style={{ marginBottom: 'var(--space-1)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input
                        type="checkbox"
                        checked={dqRuleIds.includes(r.id)}
                        onChange={(e) =>
                          setDqRuleIds((prev) =>
                            e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                          )
                        }
                      />
                      {r.name} ({r.type})
                    </label>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        <button
          type="submit"
          disabled={!name || selectedColumnIds.size === 0}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: !name || selectedColumnIds.size === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {hasConsumer ? 'Submit amendment for consumer approval' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
