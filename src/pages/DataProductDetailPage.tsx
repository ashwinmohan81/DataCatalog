import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDataProductWithContext, getAssetById, getContractById, getApplicationById, assets, getDomainById, dataContracts, applications, dqRules } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import {
  hasConsumedDataProduct,
  getProducerApplicationIdsForDataProduct,
  getConsumerAppCountForDataProduct,
  getNetScore,
  getVoteCount,
  getComment,
} from '../utils/dataProductVoting';
import { getDataProductDqSummary } from '../utils/dataProductDqSummary';
import { DQ_DIMENSION_IDS, DQ_DIMENSION_LABELS } from '../utils/dqDimensions';
import styles from './Page.module.css';

export function DataProductDetailPage() {
  const { dataProductId } = useParams();
  const runtimeProducts = useAppStore((s) => s.dataProducts);
  const contractRequests = useAppStore((s) => s.contractRequests);
  const assetDataProductOverrides = useAppStore((s) => s.assetDataProductOverrides);
  const currentApplicationId = useAppStore((s) => s.currentApplicationId);
  const dataProductVotes = useAppStore((s) => s.dataProductVotes);
  const dataProductComments = useAppStore((s) => s.dataProductComments);
  const setVote = useAppStore((s) => s.setVote);
  const addOrUpdateComment = useAppStore((s) => s.addOrUpdateComment);
  const deleteComment = useAppStore((s) => s.deleteComment);
  const setProducerResponse = useAppStore((s) => s.setProducerResponse);
  const setCurrentApplicationId = useAppStore((s) => s.setCurrentApplicationId);
  const runtimeDqRules = useAppStore((s) => s.runtimeDqRules);
  const updateDataProduct = useAppStore((s) => s.updateDataProduct);
  const result = dataProductId ? getDataProductWithContext(dataProductId, runtimeProducts) : null;

  if (!result) {
    return (
      <div className={styles.page}>
        <p>Data product not found.</p>
        <Link to="/marketplace">← Marketplace</Link>
      </div>
    );
  }

  const { domain, subdomain, dataProduct } = result;
  const isRuntimeProduct = runtimeProducts.some((p) => p.id === dataProduct.id);
  const outputAssets = dataProduct.outputPortAssetIds.map((id) => getAssetById(id)).filter(Boolean) as NonNullable<ReturnType<typeof getAssetById>>[];
  const contractFromStore = useAppStore((s) => dataProduct.contractId ? s.contractRequests.find((c) => c.id === dataProduct.contractId) : null);
  const contract = dataProduct.contractId ? (contractFromStore ?? getContractById(dataProduct.contractId)) : null;
  const currentIds = new Set(dataProduct.outputPortAssetIds);
  const assetsNotInProduct = assets.filter((a) => !currentIds.has(a.id));

  const handleRemoveAsset = (assetId: string) => {
    updateDataProduct(dataProduct.id, {
      outputPortAssetIds: dataProduct.outputPortAssetIds.filter((id) => id !== assetId),
    });
  };
  const handleAddAsset = (assetId: string) => {
    updateDataProduct(dataProduct.id, {
      outputPortAssetIds: [...dataProduct.outputPortAssetIds, assetId],
    });
  };

  const hasConsumed = Boolean(
    currentApplicationId &&
    hasConsumedDataProduct(
      dataContracts,
      contractRequests,
      assetDataProductOverrides,
      dataProduct.id,
      currentApplicationId
    )
  );
  const producerAppIds = getProducerApplicationIdsForDataProduct(dataProduct);
  const isProducer = currentApplicationId != null && producerAppIds.includes(currentApplicationId);
  const canVote = Boolean(currentApplicationId && hasConsumed);
  const myVote = (dataProductVotes[dataProduct.id]?.[currentApplicationId ?? ''] ?? 0) as -1 | 0 | 1;
  const netScore = getNetScore(dataProductVotes, dataProduct.id);
  const voteCount = getVoteCount(dataProductVotes, dataProduct.id);
  const productComments = dataProductComments.filter((c) => c.dataProductId === dataProduct.id);
  const myComment = currentApplicationId ? getComment(dataProductComments, dataProduct.id, currentApplicationId) : undefined;

  const [commentDraft, setCommentDraft] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [respondingToCommentId, setRespondingToCommentId] = useState<string | null>(null);
  const [responseDraft, setResponseDraft] = useState('');

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/marketplace" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Marketplace
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
        <h1 className={styles.title} style={{ margin: 0 }}>{dataProduct.name}</h1>
        {dataProduct.certified && <Badge variant="success">Certified</Badge>}
        {isRuntimeProduct && <Badge variant="default">Editable</Badge>}
        {dataProduct.tags.map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>
      <p className={styles.muted}>{dataProduct.description}</p>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        {domain?.name} → {subdomain?.name} · Owner: {dataProduct.owner}
        {dataProduct.sla && ` · SLA: ${dataProduct.sla}`}
      </p>

      {(() => {
        const dq = getDataProductDqSummary(dataProduct, dqRules, runtimeDqRules);
        const consumerAppCount = getConsumerAppCountForDataProduct(dataContracts, contractRequests, assetDataProductOverrides, dataProduct.id);
        const ragColor = dq.status === 'green' ? 'var(--color-success)' : dq.status === 'amber' ? '#f59e0b' : dq.status === 'red' ? 'var(--color-error, #dc2626)' : 'var(--color-text-muted)';
        return (
          <Card>
            <CardHeader title="Summary" />
            <div className={styles.grid2} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
              <div>
                <strong>Data assets</strong>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{dq.assetCount}</div>
              </div>
              <div>
                <strong>DQ rules</strong>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{dq.ruleCount}</div>
              </div>
              <div>
                <strong>DQ score</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: ragColor, flexShrink: 0 }} title={dq.status} aria-hidden />
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                    {dq.scorePct != null ? `${dq.scorePct}%` : '—'}
                  </span>
                </div>
                {dq.ruleCount > 0 && (
                  <span className={styles.muted} style={{ fontSize: 'var(--text-sm)' }}>{dq.passedCount} of {dq.ruleCount} passed</span>
                )}
              </div>
              <div>
                <strong>Consumer apps</strong>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{consumerAppCount}</div>
                <span className={styles.muted} style={{ fontSize: 'var(--text-sm)' }}>consuming this product</span>
              </div>
            </div>
            {dq.ruleCount > 0 && Object.keys(dq.byDimension).length > 0 && (
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                <strong style={{ display: 'block', marginBottom: 'var(--space-2)' }}>DQ by dimension</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {DQ_DIMENSION_IDS.map((dim) => {
                    const agg = dq.byDimension[dim];
                    if (!agg || agg.ruleCount === 0) return null;
                    const statusVariant = agg.status === 'green' ? 'success' : agg.status === 'amber' ? 'warning' : agg.status === 'red' ? 'error' : 'default';
                    return (
                      <Badge key={dim} variant={statusVariant}>
                        {DQ_DIMENSION_LABELS[dim]}: {agg.scorePct != null ? `${agg.scorePct}%` : '—'}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })()}

      <Card>
        <CardHeader title="Output ports" />
        <p className={styles.muted}>Published assets for consumption.</p>
        <ul className={styles.resultList}>
          {outputAssets.map((a) => (
            <li key={a.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3)' }}>
                <Link to={`/asset/${a.id}`} className={styles.resultLink} style={{ flex: 1 }}>
                  <span className={styles.resultName}>{a.displayName}</span>
                  <span className={styles.resultMeta}>{a.type} · {a.platform ?? '—'} · {a.owner}</span>
                </Link>
                {isRuntimeProduct && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAsset(a.id)}
                    style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)', marginLeft: 'var(--space-2)' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        {isRuntimeProduct && assetsNotInProduct.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)', padding: '0 var(--space-4) var(--space-4)' }}>
            <h3 className={styles.sectionTitle}>Add asset</h3>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Domain</th>
                    <th>Platform</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {assetsNotInProduct.slice(0, 20).map((a) => (
                    <tr key={a.id}>
                      <td><Link to={`/asset/${a.id}`}>{a.displayName}</Link></td>
                      <td>{getDomainById(a.domainId)?.name ?? '—'}</td>
                      <td>{a.platform ?? '—'}</td>
                      <td>
                        <button type="button" onClick={() => handleAddAsset(a.id)} style={{ padding: 'var(--space-1) var(--space-2)' }}>Add</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {assetsNotInProduct.length > 20 && <p className={styles.muted}>Showing first 20. Add from Catalog or create flow for full list.</p>}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Rating" />
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <label htmlFor="dp-current-app" className={styles.muted} style={{ marginRight: 'var(--space-2)' }}>Voting / commenting as:</label>
          <select
            id="dp-current-app"
            value={currentApplicationId ?? ''}
            onChange={(e) => setCurrentApplicationId(e.target.value || null)}
            style={{ padding: 'var(--space-1) var(--space-2)' }}
          >
            <option value="">— Select application —</option>
            {applications.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {netScore >= 0 ? `+${netScore}` : netScore}
          </span>
          <span className={styles.muted}>({voteCount} vote{voteCount !== 1 ? 's' : ''})</span>
          {canVote && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setVote(dataProduct.id, currentApplicationId!, myVote === 1 ? 0 : 1)}
                style={{
                  padding: 'var(--space-1) var(--space-2)',
                  fontWeight: myVote === 1 ? 600 : 400,
                }}
                title="Upvote"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => setVote(dataProduct.id, currentApplicationId!, myVote === -1 ? 0 : -1)}
                style={{
                  padding: 'var(--space-1) var(--space-2)',
                  fontWeight: myVote === -1 ? 600 : 400,
                }}
                title="Downvote"
              >
                ↓
              </button>
              {myVote !== 0 && (
                <button
                  type="button"
                  onClick={() => setVote(dataProduct.id, currentApplicationId!, 0)}
                  style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)' }}
                >
                  Remove my vote
                </button>
              )}
            </span>
          )}
          {!currentApplicationId && (
            <span className={styles.muted} style={{ fontSize: 'var(--text-sm)' }}>
              Select an application above to vote or comment.
            </span>
          )}
          {currentApplicationId && !hasConsumed && (
            <span className={styles.muted} style={{ fontSize: 'var(--text-sm)' }}>
              Only consumers who have consumed this product can vote.
            </span>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Comments" />
        {productComments.length === 0 && !myComment && (
          <p className={styles.muted}>
            {hasConsumed
              ? 'No comments yet. Add a comment below.'
              : 'Consumers who have consumed this product can add a comment.'}
          </p>
        )}
        {productComments.map((comment) => {
          const app = getApplicationById(comment.applicationId);
          const isAuthor = comment.applicationId === currentApplicationId;
          const canRespond = isProducer && !isAuthor;
          const isEditing = editingCommentId === comment.id;
          const isResponding = respondingToCommentId === comment.id;
          return (
            <div
              key={comment.id}
              style={{
                borderBottom: '1px solid var(--color-border)',
                padding: 'var(--space-3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                <strong>{app?.name ?? comment.applicationId}</strong>
                <span className={styles.muted} style={{ fontSize: 'var(--text-sm)' }}>
                  {new Date(comment.createdAt).toLocaleString()}
                  {comment.updatedAt && ` (edited)`}
                </span>
              </div>
              {isEditing ? (
                <div style={{ marginBottom: 'var(--space-2)' }}>
                  <textarea
                    value={editingCommentText}
                    onChange={(e) => setEditingCommentText(e.target.value)}
                    rows={2}
                    style={{ width: '100%', padding: 'var(--space-2)', marginBottom: 'var(--space-2)' }}
                  />
                  <button type="button" onClick={() => { addOrUpdateComment(dataProduct.id, comment.applicationId, editingCommentText); setEditingCommentId(null); setEditingCommentText(''); }}>Save</button>
                  <button type="button" onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} style={{ marginLeft: 'var(--space-2)' }}>Cancel</button>
                </div>
              ) : (
                <p style={{ margin: 0 }}>{comment.text}</p>
              )}
              {comment.producerResponse != null && comment.producerResponse !== '' && (
                <div style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-4)', borderLeft: '3px solid var(--color-primary)' }}>
                  <div className={styles.muted} style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>Producer response</div>
                  <p style={{ margin: 0 }}>{comment.producerResponse}</p>
                  {comment.producerResponseAt && <span className={styles.muted} style={{ fontSize: 'var(--text-xs)' }}> {new Date(comment.producerResponseAt).toLocaleString()}</span>}
                </div>
              )}
              {canRespond && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  {isResponding ? (
                    <>
                      <textarea
                        value={responseDraft}
                        onChange={(e) => setResponseDraft(e.target.value)}
                        placeholder="Write a response…"
                        rows={2}
                        style={{ width: '100%', padding: 'var(--space-2)', marginBottom: 'var(--space-2)' }}
                      />
                      <button type="button" onClick={() => { setProducerResponse(comment.id, responseDraft); setRespondingToCommentId(null); setResponseDraft(''); }}>Save response</button>
                      <button type="button" onClick={() => { setRespondingToCommentId(null); setResponseDraft(''); }} style={{ marginLeft: 'var(--space-2)' }}>Cancel</button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setRespondingToCommentId(comment.id); setResponseDraft(comment.producerResponse ?? ''); }}
                      style={{ fontSize: 'var(--text-sm)' }}
                    >
                      {comment.producerResponse ? 'Edit response' : 'Respond'}
                    </button>
                  )}
                </div>
              )}
              {isAuthor && !isEditing && (
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <button type="button" onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.text); }} style={{ fontSize: 'var(--text-sm)', marginRight: 'var(--space-2)' }}>Edit</button>
                  <button type="button" onClick={() => deleteComment(dataProduct.id, comment.applicationId)} style={{ fontSize: 'var(--text-sm)' }}>Delete</button>
                </div>
              )}
            </div>
          );
        })}
        {hasConsumed && !myComment && (
          <div style={{ padding: 'var(--space-3)' }}>
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Add a comment…"
              rows={3}
              style={{ width: '100%', padding: 'var(--space-2)', marginBottom: 'var(--space-2)' }}
            />
            <button
              type="button"
              disabled={!commentDraft.trim()}
              onClick={() => { addOrUpdateComment(dataProduct.id, currentApplicationId!, commentDraft.trim()); setCommentDraft(''); }}
              style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)' }}
            >
              Add comment
            </button>
          </div>
        )}
        {false && hasConsumed && myComment && (
          <div style={{ padding: 'var(--space-3)' }}>
            <p className={styles.muted} style={{ fontSize: 'var(--text-sm)' }}>Your comment: “{myComment?.text}” — Edit or Delete above.</p>
          </div>
        )}
      </Card>

      {contract && (
        <Card>
          <CardHeader title="Data contract" action={<Badge variant="info">v{contract.version}</Badge>} />
          <p className={styles.muted}>{contract.name}</p>
          <Link to={`/contracts/${contract.id}`}>View contract</Link>
          {contract.status === 'approved' && <> · <Link to={`/contracts/consume/${contract.id}`}>Consume contract →</Link></>}
        </Card>
      )}
    </div>
  );
}
