import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getContractById,
  getAssetById,
  getApplicationById,
  applications,
  dqRules,
  assetBelongsToDataProduct,
} from '../data/mock';
import type { DQRule } from '../data/mock/types';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { buildOdcsYaml } from '../utils/contractToOdcs';
import styles from './Page.module.css';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  approved: 'success',
  pending_approval: 'warning',
  rejected: 'error',
  draft: 'default',
};

export function ContractDetailPage() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const fromStore = useAppStore((s) => s.contractRequests.find((c) => c.id === contractId));
  const fromStatic = contractId ? getContractById(contractId) : null;
  const contract = fromStore ?? fromStatic;
  const setContractStatus = useAppStore((s) => s.setContractStatus);
  const ensureContractInStore = useAppStore((s) => s.ensureContractInStore);
  const contractAmendmentRequests = useAppStore((s) => s.contractAmendmentRequests);
  const setContractAmendmentStatus = useAppStore((s) => s.setContractAmendmentStatus);
  const currentApplicationId = useAppStore((s) => s.currentApplicationId);
  const setCurrentApplicationId = useAppStore((s) => s.setCurrentApplicationId);
  const runtimeDqRules = useAppStore((s) => s.runtimeDqRules);
  const [rejectReason, setRejectReason] = useState('');
  const [amendmentRejectReason, setAmendmentRejectReason] = useState('');
  const [selectedDqRuleIds, setSelectedDqRuleIds] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [pushProvider, setPushProvider] = useState<'s3' | 'gcs' | 'azure'>('s3');
  const [pushBucket, setPushBucket] = useState('');
  const [pushPath, setPushPath] = useState('');
  const asset = contract ? getAssetById(contract.assetId) : null;
  const runtimeProducts = useAppStore((s) => s.dataProducts);
  const assetInDataProduct = asset ? assetBelongsToDataProduct(asset, runtimeProducts) : false;
  const pendingAmendment = contract ? contractAmendmentRequests.find((a) => a.contractId === contract.id && a.status === 'pending_consumer_approval') : null;
  const isProducer = Boolean(asset?.applicationId && currentApplicationId && asset.applicationId === currentApplicationId && assetInDataProduct);
  const isConsumer = Boolean(contract?.requestedByApplicationId && currentApplicationId && contract.requestedByApplicationId === currentApplicationId);
  const requesterApp = contract?.requestedByApplicationId ? getApplicationById(contract.requestedByApplicationId) : null;
  const approverApp = contract?.approvedByApplicationId ? getApplicationById(contract.approvedByApplicationId) : null;
  const assetDqRules = asset
    ? [...dqRules.filter((r) => r.assetId === asset.id), ...runtimeDqRules.filter((r) => r.assetId === asset.id)]
    : [];
  const getDqRuleById = (id: string) => dqRules.find((r) => r.id === id) ?? runtimeDqRules.find((r) => r.id === id);

  if (!contract) {
    return (
      <div className={styles.page}>
        <p>Contract not found.</p>
        <Link to="/contracts">← Contracts</Link>
      </div>
    );
  }

  const contractDqRules = (contract.dqRuleIds ?? [])
    .map((id) => getDqRuleById(id))
    .filter((r): r is DQRule => r != null);

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/contracts" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Contracts
        </Link>
      </div>
      {asset && !assetInDataProduct && (
        <div
          role="alert"
          style={{
            marginBottom: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--color-warning, #fef3c7)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text)',
          }}
        >
          This contract’s asset is not part of a data product. Contracts should only be created for assets that belong to a data product.
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
        <h1 className={styles.title} style={{ margin: 0 }}>{contract.name}</h1>
        <Badge variant={statusVariant[contract.status] ?? 'default'}>{contract.status.replace('_', ' ')}</Badge>
        <Badge variant="info">v{contract.version}</Badge>
        {isProducer && (
          <button
            type="button"
            onClick={() => {
              ensureContractInStore(contract);
              navigate(`/contracts/${contract.id}/edit`);
            }}
            style={{
              padding: 'var(--space-1) var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        )}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setExportOpen((o) => !o)}
            style={{
              padding: 'var(--space-1) var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
            }}
          >
            Export
          </button>
          {exportOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setExportOpen(false)} aria-hidden="true" />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 'var(--space-1)',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 11,
                  minWidth: 180,
                }}
              >
                <button
                  type="button"
                  style={{ display: 'block', width: '100%', padding: 'var(--space-2) var(--space-3)', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={() => {
                    const dqRulesForExport = (contract.dqRuleIds ?? [])
                      .map((id) => getDqRuleById(id))
                      .filter((r): r is DQRule => r != null);
                    const yamlStr = buildOdcsYaml(contract, asset, dqRulesForExport);
                    const blob = new Blob([yamlStr], { type: 'application/yaml' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `contract-${contract.id}-v${contract.version}.yaml`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                    setExportOpen(false);
                  }}
                >
                  Export as YAML
                </button>
                <button
                  type="button"
                  style={{ display: 'block', width: '100%', padding: 'var(--space-2) var(--space-3)', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={() => {
                    setPushPath(`contracts/${contract.id}.yaml`);
                    setPushModalOpen(true);
                    setExportOpen(false);
                  }}
                >
                  Push to object store
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {pushModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
          onClick={() => setPushModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              maxWidth: 420,
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>Push to object store</h2>
            <p className={styles.muted} style={{ marginBottom: 'var(--space-3)' }}>
              In production, this would push the contract YAML to the selected store. For now, copy the URI and download the YAML to upload manually.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Provider</span>
                <select
                  value={pushProvider}
                  onChange={(e) => setPushProvider(e.target.value as 's3' | 'gcs' | 'azure')}
                  style={{ width: '100%', padding: 'var(--space-2)' }}
                >
                  <option value="s3">Amazon S3</option>
                  <option value="gcs">Google Cloud Storage</option>
                  <option value="azure">Azure Blob Storage</option>
                </select>
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Bucket</span>
                <input
                  type="text"
                  value={pushBucket}
                  onChange={(e) => setPushBucket(e.target.value)}
                  placeholder="my-bucket"
                  style={{ width: '100%', padding: 'var(--space-2)' }}
                />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Path</span>
                <input
                  type="text"
                  value={pushPath}
                  onChange={(e) => setPushPath(e.target.value)}
                  placeholder="contracts/contract-id.yaml"
                  style={{ width: '100%', padding: 'var(--space-2)' }}
                />
              </label>
            </div>
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const uri = pushProvider === 'azure'
                    ? `https://${pushBucket}.blob.core.windows.net/${pushPath}`
                    : `${pushProvider === 's3' ? 's3' : 'gs'}://${pushBucket}/${pushPath}`;
                  void navigator.clipboard.writeText(uri);
                }}
                style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-surface)', cursor: 'pointer' }}
              >
                Copy URI
              </button>
              <button
                type="button"
                onClick={() => {
                  const dqRulesForExport = (contract.dqRuleIds ?? [])
                    .map((id) => getDqRuleById(id))
                    .filter((r): r is DQRule => r != null);
                  const yamlStr = buildOdcsYaml(contract, asset, dqRulesForExport);
                  const blob = new Blob([yamlStr], { type: 'application/yaml' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `contract-${contract.id}-v${contract.version}.yaml`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                }}
                style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-surface)', cursor: 'pointer' }}
              >
                Download YAML
              </button>
              <button
                type="button"
                onClick={() => setPushModalOpen(false)}
                style={{ padding: 'var(--space-2) var(--space-3)', border: 'none', borderRadius: 'var(--radius)', background: 'var(--color-text-muted)', color: 'white', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <p className={styles.muted}>
        Asset: {asset ? <Link to={`/asset/${contract.assetId}`}>{asset.displayName}</Link> : contract.assetId}
        {' · '}Created by {contract.createdBy} · {new Date(contract.createdAt).toLocaleString()}
        {requesterApp && ` · Requested by: ${requesterApp.name}`}
        {contract.status === 'approved' && approverApp && ` · Approved by: ${approverApp.name}`}
        {contract.approvedAt && ` · ${new Date(contract.approvedAt).toLocaleString()}`}
        {contract.rejectedReason && ` · Rejected: ${contract.rejectedReason}`}
      </p>

      <div style={{ marginBottom: 'var(--space-3)' }}>
        <label htmlFor="contract-view-as" className={styles.muted} style={{ marginRight: 'var(--space-2)' }}>View as:</label>
        <select
          id="contract-view-as"
          value={currentApplicationId ?? ''}
          onChange={(e) => setCurrentApplicationId(e.target.value || null)}
          style={{ padding: 'var(--space-1) var(--space-2)' }}
        >
          <option value="">— Select application —</option>
          {applications.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
          ))}
        </select>
        {asset?.applicationId && (
          <span className={styles.muted} style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
            {isProducer ? 'You are the producer → Edit contract above.' : `To edit, select the producer: ${getApplicationById(asset.applicationId)?.name ?? asset.applicationId}`}
          </span>
        )}
      </div>

      {/* Pending amendment: consumer — Approve/Reject */}
      {pendingAmendment && isConsumer && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
            <CardHeader title="Pending amendment — your approval required" />
            <p className={styles.muted}>
              Producer requested changes: name {pendingAmendment.proposed.name ?? '(unchanged)'}, {pendingAmendment.proposed.schema.length} attributes, {pendingAmendment.proposed.slas?.length ?? 0} SLAs, {pendingAmendment.proposed.dqRuleIds?.length ?? 0} DQ rules.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
              <button
                type="button"
                onClick={() =>
                  setContractAmendmentStatus(pendingAmendment.id, 'approved', {
                    consumerRespondedBy: currentApplicationId ?? undefined,
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
                  value={amendmentRejectReason}
                  onChange={(e) => setAmendmentRejectReason(e.target.value)}
                  style={{ padding: 'var(--space-2)', minWidth: 200 }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setContractAmendmentStatus(pendingAmendment.id, 'rejected', {
                      consumerRespondedBy: currentApplicationId ?? undefined,
                      rejectReason: amendmentRejectReason || 'Rejected by consumer',
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
          </Card>
        </div>
      )}

      {/* Pending amendment: producer — read-only */}
      {pendingAmendment && isProducer && !isConsumer && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
            <CardHeader title="Amendment pending consumer approval" />
            <p className={styles.muted}>
              Your proposed changes are waiting for the consumer to approve or reject.
            </p>
          </Card>
        </div>
      )}

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

      {/* Fit-for-purpose DQ checks (consumer) */}
      {asset && (
        <div style={{ marginBottom: 'var(--space-4)' }}><Card>
          <CardHeader title="Fit-for-purpose DQ checks (optional)" />
          <p className={styles.muted}>Select which data quality checks you want enabled for your consumption.</p>
          {assetDqRules.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--space-2) 0 0' }}>
              {assetDqRules.map((r) => (
                <li key={r.id} style={{ marginBottom: 'var(--space-1)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="checkbox"
                      checked={selectedDqRuleIds.includes(r.id)}
                      onChange={(e) =>
                        setSelectedDqRuleIds((prev) =>
                          e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                        )
                      }
                    />
                    {r.name} ({r.type})
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.muted}>No DQ rules defined on this asset. Add rules on the asset Data quality tab.</p>
          )}
        </Card></div>
      )}

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

      {/* Consumer: Request access / Onboard */}
      {contract.status === 'approved' && (
        <div style={{ marginTop: 'var(--space-4)' }}><Card>
          <CardHeader title="Request access / Onboard" />
          <p className={styles.muted}>As a consumer, request access and get a snapshot with your selected attributes and DQ checks.</p>
          <p style={{ marginTop: 'var(--space-3)' }}>
            <Link
              to={`/contracts/consume/${contract.id}`}
              state={{ selectedDqRuleIds }}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--color-primary)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 'var(--radius)',
                display: 'inline-block',
              }}
            >
              Onboard →
            </Link>
          </p>
        </Card></div>
      )}

      {(contract.status === 'pending_approval' || contract.status === 'draft') && (
        <p className={styles.muted} style={{ marginTop: 'var(--space-4)' }}>
          This contract is pending producer approval. You can request access once it is approved.
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
