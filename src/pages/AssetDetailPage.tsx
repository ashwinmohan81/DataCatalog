import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getAssetById,
  getContractByAssetId,
  getDataProductWithContext,
  getApplicationById,
  getGlossaryById,
  glossaries,
  lineageGraphs,
  dqRules,
  dqRuns,
  glossaryTerms as staticGlossaryTerms,
} from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import { Tabs } from '../components/Tabs';
import { LineageFlowCanvas } from '../components/LineageFlowCanvas';
import { getRecommendedTerms } from '../utils/glossaryFuzzyMatch';
import styles from './Page.module.css';

type TabId = 'overview' | 'schema' | 'profile' | 'lineage' | 'glossary' | 'tags' | 'dq' | 'versions' | 'contract' | 'activity';

export function AssetDetailPage() {
  const { assetId } = useParams();
  const asset = assetId ? getAssetById(assetId) : null;
  const [tab, setTab] = useState<TabId>('overview');
  const [selectedLineageColumnId, setSelectedLineageColumnId] = useState<string>('');

  if (!asset) {
    return (
      <div className={styles.page}>
        <p>Asset not found.</p>
      </div>
    );
  }

  const contractFromStore = useAppStore((s) => s.contractRequests.find((c) => c.assetId === asset.id));
  const contract = getContractByAssetId(asset.id) ?? contractFromStore ?? null;
  const setContractStatus = useAppStore((s) => s.setContractStatus);
  const [contractRejectReason, setContractRejectReason] = useState('');
  const runtimeProducts = useAppStore((s) => s.dataProducts);
  const assetDataProductOverrides = useAppStore((s) => s.assetDataProductOverrides);
  const resolvedDataProductId = assetDataProductOverrides[asset.id] ?? asset.dataProductId;
  const productInfo = resolvedDataProductId ? getDataProductWithContext(resolvedDataProductId, runtimeProducts) : null;
  const application = asset.applicationId ? getApplicationById(asset.applicationId) : null;
  const runtimeGlossaryTerms = useAppStore((s) => s.glossaryTerms);
  const columnTermLinks = useAppStore((s) => s.columnTermLinks);
  const addColumnTermLink = useAppStore((s) => s.addColumnTermLink);
  const removeColumnTermLink = useAppStore((s) => s.removeColumnTermLink);
  const customTags = useAppStore((s) => s.customTags);
  const columnTagOverrides = useAppStore((s) => s.columnTagOverrides);
  const setColumnTags = useAppStore((s) => s.setColumnTags);
  const allTerms = [...staticGlossaryTerms, ...runtimeGlossaryTerms];
  const getColumnDisplayTags = (colId: string) => {
    const col = asset.columns.find((c) => c.id === colId);
    const key = `${asset.id}:${colId}`;
    if (columnTagOverrides[key] !== undefined) return columnTagOverrides[key];
    return col?.tags ?? [];
  };
  const addColumnTag = (colId: string, tag: string) => {
    const current = getColumnDisplayTags(colId);
    if (!current.includes(tag)) setColumnTags(asset.id, colId, [...current, tag]);
  };
  const removeColumnTag = (colId: string, tag: string) => {
    const current = getColumnDisplayTags(colId);
    setColumnTags(asset.id, colId, current.filter((t) => t !== tag));
  };
  const termsByGlossaryId = allTerms.reduce<Record<string, typeof allTerms>>((acc, t) => {
    if (!acc[t.glossaryId]) acc[t.glossaryId] = [];
    acc[t.glossaryId].push(t);
    return acc;
  }, {});
  const glossaryIdsOrdered = [
    ...glossaries.map((g) => g.id),
    ...Object.keys(termsByGlossaryId).filter((id) => !glossaries.some((g) => g.id === id)),
  ];
  const getTermIdsForColumn = (colId: string) => {
    const col = asset.columns.find((c) => c.id === colId);
    if (!col) return [];
    const fromStore = columnTermLinks.filter((l) => l.assetId === asset.id && l.columnId === colId).map((l) => l.termId);
    return [...new Set([...col.glossaryTermIds, ...fromStore])];
  };
  const lineageForAsset = lineageGraphs.filter((l) => l.assetId === asset.id);
  const selectedLineageGraphForAsset =
    lineageForAsset.find((g) => g.columnId === selectedLineageColumnId) ?? lineageForAsset[0] ?? null;
  const assetDqRules = dqRules.filter((r) => r.assetId === asset.id);
  const assetDqRuns = dqRuns.filter((r) => r.assetId === asset.id);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'schema', label: 'Schema' },
    { id: 'profile', label: 'Profile' },
    { id: 'lineage', label: 'Lineage' },
    { id: 'glossary', label: 'Glossary' },
    { id: 'tags', label: 'Tags' },
    { id: 'dq', label: 'Data quality' },
    { id: 'versions', label: 'Versions' },
    ...(contract ? [{ id: 'contract' as TabId, label: 'Contract' }] : []),
    { id: 'activity', label: 'Activity' },
  ];

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/catalog" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Catalog
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
        <h1 className={styles.title} style={{ margin: 0 }}>{asset.displayName}</h1>
        <Badge variant={asset.tier === 1 ? 'info' : 'default'}>Tier {asset.tier} {asset.tier === 1 ? '(Key/Golden)' : asset.tier === 2 ? '(Standard)' : '(Supporting)'}</Badge>
        {asset.platform && <Badge variant="default">Platform: {asset.platform}</Badge>}
        {asset.zone && <Badge variant="default">Zone: {asset.zone}</Badge>}
        {application && <Badge variant="default"><Link to={`/inventory/application/${application.id}`}>{application.name}</Link></Badge>}
        {asset.certified && <Badge variant="success">Certified</Badge>}
        {asset.isOutputPort && <Badge variant="info">Output port</Badge>}
        {asset.tags.map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>
      <p className={styles.muted} style={{ marginBottom: 'var(--space-4)' }}>
        {asset.description}
      </p>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
        Owner: {asset.owner}
        {asset.platform && ` · Platform: ${asset.platform}`}
        {' · Data product: '}{productInfo && <Link to={`/data-product/${resolvedDataProductId}`}>{productInfo.dataProduct.name}</Link>}
        {asset.lastScanAt && ` · Last scan: ${new Date(asset.lastScanAt).toLocaleString()}`}
      </p>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className={styles.tabContent}>
        {tab === 'overview' && (
          <>
            <Card>
              <CardHeader title="Summary" />
              <div className={styles.grid2}>
                <div>
                  <strong>Type</strong>: {asset.type}
                </div>
                <div>
                  <strong>Rows</strong>: {asset.profile?.rowCount?.toLocaleString() ?? '—'}
                </div>
                <div>
                  <strong>Columns</strong>: {asset.columns.length}
                </div>
                <div>
                  <strong>Connector</strong>: {asset.connectorName ?? '—'}
                </div>
              </div>
            </Card>
          </>
        )}

        {tab === 'schema' && (
          <Card>
            <CardHeader title="Columns" />
            <p className={styles.muted}>Link columns to glossary terms (an attribute can link to multiple terms). Use fuzzy recommendations or pick any term.</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Glossary terms</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {asset.columns.map((c) => {
                    const termIds = getTermIdsForColumn(c.id);
                    const storeLinkTermIds = columnTermLinks.filter((l) => l.assetId === asset.id && l.columnId === c.id).map((l) => l.termId);
                    const recommended = getRecommendedTerms(c.name, c.description, allTerms, termIds, 8);
                    const recommendedByGlossary = glossaryIdsOrdered.reduce<Array<{ glossaryId: string; glossaryName: string; items: typeof recommended }>>((acc, gid) => {
                      const gl = getGlossaryById(gid);
                      const items = recommended.filter((r) => r.term.glossaryId === gid);
                      if (items.length > 0) acc.push({ glossaryId: gid, glossaryName: gl?.name ?? gid, items });
                      return acc;
                    }, []);
                    const availableTermsByGlossary = glossaryIdsOrdered.map((gid) => {
                      const gl = getGlossaryById(gid);
                      const termsInG = (termsByGlossaryId[gid] ?? []).filter((t) => !termIds.includes(t.id));
                      return { glossaryId: gid, glossaryName: gl?.name ?? gid, terms: termsInG };
                    }).filter((g) => g.terms.length > 0);
                    return (
                      <tr key={c.id}>
                        <td><code>{c.name}</code></td>
                        <td>{c.type}</td>
                        <td>{c.description ?? '—'}</td>
                        <td>
                          {termIds.length > 0 ? (
                            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', alignItems: 'center' }}>
                              {termIds.map((tid) => {
                                const t = allTerms.find((x) => x.id === tid);
                                const fromStore = storeLinkTermIds.includes(tid);
                                const gl = t ? getGlossaryById(t.glossaryId) : null;
                                return t ? (
                                  <span key={tid}>
                                    <Link to={`/glossary/term/${tid}`}>{t.name}</Link>
                                    {gl && <span className={styles.muted} style={{ fontSize: 'var(--text-xs)', marginLeft: 'var(--space-1)' }}>({gl.name})</span>}
                                    {fromStore && (
                                      <button type="button" onClick={() => removeColumnTermLink(asset.id, c.id, tid)} style={{ marginLeft: 'var(--space-1)', padding: '0 var(--space-1)', fontSize: 'var(--text-sm)' }} aria-label="Unlink">×</button>
                                    )}
                                  </span>
                                ) : null;
                              })}
                            </span>
                          ) : '—'}
                          {recommendedByGlossary.length > 0 && (
                            <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                              <span className={styles.muted}>Recommendations: </span>
                              {recommendedByGlossary.map(({ glossaryId, glossaryName, items }) => (
                                <div key={glossaryId} style={{ marginTop: 'var(--space-1)' }}>
                                  <Link to={`/glossary/glossary/${glossaryId}`} style={{ fontWeight: 'var(--font-medium)' }}>{glossaryName}</Link>
                                  {': '}
                                  {items.map(({ term, score }) => (
                                    <span key={term.id} style={{ marginRight: 'var(--space-2)' }}>
                                      <Link to={`/glossary/term/${term.id}`}>{term.name}</Link>
                                      <span className={styles.muted} style={{ marginLeft: 'var(--space-1)' }}>({Math.round(score * 100)}%)</span>
                                      <button type="button" onClick={() => addColumnTermLink(asset.id, c.id, term.id)} style={{ marginLeft: 'var(--space-1)', padding: '0 var(--space-2)', fontSize: 'var(--text-sm)' }}>Add</button>
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ marginTop: 'var(--space-2)' }}>
                            <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Pick from glossary:</span>
                            <select
                              data-column-id={c.id}
                              onChange={(e) => {
                                const tid = e.target.value;
                                if (tid) { addColumnTermLink(asset.id, c.id, tid); e.target.value = ''; }
                              }}
                              style={{ padding: 'var(--space-2)', fontSize: 'var(--text-sm)', minWidth: 220 }}
                              value=""
                            >
                              <option value="">Link to term…</option>
                              {availableTermsByGlossary.map(({ glossaryId, glossaryName, terms }) => (
                                <optgroup key={glossaryId} label={glossaryName}>
                                  {terms.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </optgroup>
                              ))}
                              {availableTermsByGlossary.length === 0 && <option value="">No more terms</option>}
                            </select>
                            <span className={styles.muted} style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>Terms grouped by glossary; open a glossary to browse all terms.</span>
                          </div>
                        </td>
                        <td>{getColumnDisplayTags(c.id).map((t) => <Badge key={t}>{t}</Badge>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'profile' && (
          <Card>
            <CardHeader title="Profile" />
            <p className={styles.muted}>Last scan: {asset.profile?.lastScanAt ? new Date(asset.profile.lastScanAt).toLocaleString() : '—'}</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Rows</th>
                    <th>Distinct</th>
                    <th>Nulls</th>
                    <th>Min</th>
                    <th>Max</th>
                  </tr>
                </thead>
                <tbody>
                  {asset.columns.map((c) => (
                    <tr key={c.id}>
                      <td><code>{c.name}</code></td>
                      <td>{c.profile?.rowCount?.toLocaleString() ?? '—'}</td>
                      <td>{c.profile?.distinctCount?.toLocaleString() ?? '—'}</td>
                      <td>{c.profile?.nullCount?.toLocaleString() ?? '—'}</td>
                      <td>{c.profile?.min ?? '—'}</td>
                      <td>{c.profile?.max ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'lineage' && (
          <Card>
            <CardHeader title="Column-level lineage" />
            {lineageForAsset.length === 0 ? (
              <p className={styles.muted}>No lineage data for this asset.</p>
            ) : (
              <>
                {lineageForAsset.length > 1 && (
                  <div className={styles.lineageColumnTabs} style={{ marginBottom: 'var(--space-4)' }}>
                    {lineageForAsset.map((g) => {
                      const col = asset.columns.find((c) => c.id === g.columnId);
                      const columnName = col?.name ?? g.columnId;
                      const isSelected = selectedLineageColumnId === g.columnId || (!selectedLineageColumnId && lineageForAsset[0].columnId === g.columnId);
                      return (
                        <button
                          key={g.columnId}
                          type="button"
                          onClick={() => setSelectedLineageColumnId(g.columnId)}
                          className={`${styles.lineageColumnTab} ${isSelected ? styles.lineageColumnTabActive : ''}`}
                        >
                          <code>{columnName}</code>
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedLineageGraphForAsset && <LineageFlowCanvas graph={selectedLineageGraphForAsset} />}
                <div className={styles.lineageGraphLegend}>
                  <span className={styles.lineageGraphLegendItem}><span className={styles.lineageLegendDotSource} /> Source</span>
                  <span className={styles.lineageGraphLegendItem}><span className={styles.lineageLegendDotTransform} /> Transform</span>
                  <span className={styles.lineageGraphLegendItem}><span className={styles.lineageLegendDotDest} /> Destination</span>
                </div>
              </>
            )}
          </Card>
        )}

        {tab === 'glossary' && (
          <Card>
            <CardHeader title="Glossary mapping" />
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Term</th>
                    <th>Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {asset.columns.map((c) => {
                    const termIds = getTermIdsForColumn(c.id);
                    const terms = termIds.map((tid) => allTerms.find((t) => t.id === tid)).filter(Boolean) as typeof allTerms;
                    return (
                      <tr key={c.id}>
                        <td><code>{c.name}</code></td>
                        <td>
                          {terms.length ? terms.map((t) => <Link key={t.id} to={`/glossary/term/${t.id}`}>{t.name}</Link>) : '—'}
                        </td>
                        <td>{terms[0] ? (terms[0].definition?.slice(0, 60) ?? '') + (terms[0].definition && terms[0].definition.length > 60 ? '…' : '') : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'tags' && (
          <Card>
            <CardHeader title="Attribute tags" />
            <p className={styles.muted}>
              Tag columns (attributes) with custom tags. Add tags in <Link to="/tags">Tag management</Link> first, then add them here.
            </p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {asset.columns.map((c) => {
                    const displayTags = getColumnDisplayTags(c.id);
                    const availableToAdd = customTags.filter((t) => !displayTags.includes(t));
                    return (
                      <tr key={c.id}>
                        <td><code>{c.name}</code></td>
                        <td>{c.type}</td>
                        <td>
                          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', alignItems: 'center' }}>
                            {displayTags.map((tag) => (
                              <span key={tag}>
                                <Badge>{tag}</Badge>
                                <button type="button" onClick={() => removeColumnTag(c.id, tag)} style={{ marginLeft: 'var(--space-1)', padding: '0 var(--space-1)', fontSize: 'var(--text-sm)' }} aria-label={`Remove ${tag}`}>×</button>
                              </span>
                            ))}
                          </span>
                          {customTags.length > 0 && (
                            <div style={{ marginTop: 'var(--space-2)' }}>
                              <select
                                value=""
                                onChange={(e) => { const v = e.target.value; if (v) { addColumnTag(c.id, v); e.target.value = ''; } }}
                                style={{ padding: 'var(--space-1)', fontSize: 'var(--text-sm)' }}
                              >
                                <option value="">Add tag…</option>
                                {availableToAdd.map((tag) => (
                                  <option key={tag} value={tag}>{tag}</option>
                                ))}
                                {availableToAdd.length === 0 && <option value="">All tags applied</option>}
                              </select>
                            </div>
                          )}
                          {customTags.length === 0 && <span className={styles.muted} style={{ fontSize: 'var(--text-sm)' }}>Add tags in Tag management first.</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {tab === 'dq' && (
          <>
            <Card>
              <CardHeader title="Rules" />
              {assetDqRules.length === 0 ? (
                <p className={styles.muted}>No DQ rules defined.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Type</th>
                        <th>Last run</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetDqRules.map((r) => (
                        <tr key={r.id}>
                          <td>{r.name}</td>
                          <td>{r.type}</td>
                          <td>{r.lastRunAt ? new Date(r.lastRunAt).toLocaleString() : '—'}</td>
                          <td>{r.lastRunPassed === true ? <Badge variant="success">Passed</Badge> : r.lastRunPassed === false ? <Badge variant="error">Failed</Badge> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
            <Card>
              <CardHeader title="Run history" />
              {assetDqRuns.length === 0 ? (
                <p className={styles.muted}>No runs yet.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Rule</th>
                        <th>Run at</th>
                        <th>Passed</th>
                        <th>Failed count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assetDqRuns.map((r) => (
                        <tr key={r.id}>
                          <td>{dqRules.find((x) => x.id === r.ruleId)?.name ?? r.ruleId}</td>
                          <td>{new Date(r.runAt).toLocaleString()}</td>
                          <td>{r.passed ? <Badge variant="success">Yes</Badge> : <Badge variant="error">No</Badge>}</td>
                          <td>{r.failedCount ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {tab === 'versions' && (
          <Card>
            <CardHeader title="Versions" />
            {asset.versions.length === 0 ? (
              <p className={styles.muted}>No version history.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {asset.versions.map((v) => (
                  <li key={v.id} style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                    <strong>{v.label}</strong> · {new Date(v.at).toLocaleString()} · {v.by}
                    <div className={styles.muted} style={{ marginTop: 'var(--space-1)' }}>{v.changeSummary}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'contract' && contract && (
          <>
            <Card>
              <CardHeader
                title={contract.name}
                action={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Badge variant={contract.status === 'approved' ? 'success' : contract.status === 'pending_approval' ? 'warning' : 'default'}>
                      {contract.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="info">v{contract.version}</Badge>
                  </span>
                }
              />
              <p className={styles.muted}>Created by {contract.createdBy} · {new Date(contract.createdAt).toLocaleString()}</p>
              <p style={{ marginBottom: 'var(--space-3)' }}>
                <Link to={`/contracts/${contract.id}`}>View full contract</Link>
                {contract.status === 'approved' && (
                  <> · <Link to={`/contracts/consume/${contract.id}`}>Consume this contract →</Link></>
                )}
              </p>

              {contract.slas && contract.slas.length > 0 && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <strong>SLAs</strong>
                  <div className={styles.tableWrap} style={{ marginTop: 'var(--space-2)' }}>
                    <table className={styles.table}>
                      <thead>
                        <tr><th>Type</th><th>Target</th></tr>
                      </thead>
                      <tbody>
                        {contract.slas.map((sla, i) => (
                          <tr key={i}><td>{sla.type}</td><td>{sla.target}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {!contract.slas?.length && contract.slo && <p><strong>SLO</strong>: {contract.slo}</p>}

              <div className={styles.tableWrap} style={{ marginTop: 'var(--space-4)' }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Attribute</th>
                      <th>Type</th>
                      <th>Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contract.schema.map((attr) => (
                      <tr key={attr.id}>
                        <td>{attr.name}</td>
                        <td>{attr.type}</td>
                        <td>{attr.required ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {contract.dqRuleIds && contract.dqRuleIds.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <strong>DQ rules</strong>
                  <ul style={{ margin: 'var(--space-2) 0 0', paddingLeft: 'var(--space-4)' }}>
                    {contract.dqRuleIds.map((rid) => {
                      const r = dqRules.find((x) => x.id === rid);
                      return r ? <li key={r.id}>{r.name} ({r.type})</li> : null;
                    })}
                  </ul>
                </div>
              )}

              {contract.versionHistory && contract.versionHistory.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <strong>Version history</strong>
                  <ul style={{ listStyle: 'none', margin: 'var(--space-2) 0 0', padding: 0 }}>
                    {[...contract.versionHistory].reverse().map((v, i) => (
                      <li key={i} style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                        <strong>v{v.version}</strong> · {new Date(v.at).toLocaleString()} · {v.by}
                        <div className={styles.muted} style={{ marginTop: 'var(--space-1)' }}>{v.changeSummary}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {contract.status === 'pending_approval' && asset.applicationId && (
              <div style={{ marginTop: 'var(--space-4)' }}><Card>
                <CardHeader title="Producer approval" />
                <p className={styles.muted}>Approve or reject this contract request.</p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setContractStatus(contract.id, 'approved', {
                        approvedByApplicationId: asset.applicationId,
                        approvedAt: new Date().toISOString(),
                      })
                    }
                    style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: 'var(--radius)' }}
                  >
                    Approve
                  </button>
                  <input
                    type="text"
                    placeholder="Rejection reason (optional)"
                    value={contractRejectReason}
                    onChange={(e) => setContractRejectReason(e.target.value)}
                    style={{ padding: 'var(--space-2)', minWidth: 200 }}
                  />
                  <button
                    type="button"
                    onClick={() => setContractStatus(contract.id, 'rejected', { rejectedReason: contractRejectReason || 'Rejected by producer' })}
                    style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-error, #c00)', color: 'white', border: 'none', borderRadius: 'var(--radius)' }}
                  >
                    Reject
                  </button>
                </div>
              </Card></div>
            )}
          </>
        )}

        {tab === 'activity' && (
          <Card>
            <CardHeader title="Activity & chat" />
            <p className={styles.muted}>Mock: contextual chat thread for this asset. In production, messages would appear here.</p>
            <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', marginTop: 'var(--space-3)' }}>
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <strong>Jane Risk</strong> <span className={styles.muted}>2 hours ago</span>
                <p style={{ margin: 'var(--space-1) 0 0' }}>Can we add exposure_amount_eur to the contract?</p>
              </div>
              <div>
                <strong>You</strong> <span className={styles.muted}>1 hour ago</span>
                <p style={{ margin: 'var(--space-1) 0 0' }}>Added in v2. Will publish tomorrow.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
