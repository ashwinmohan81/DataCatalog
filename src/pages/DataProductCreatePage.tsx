import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { domains, assets, getDomainById } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import styles from './Page.module.css';

export function DataProductCreatePage() {
  const navigate = useNavigate();
  const addDataProduct = useAppStore((s) => s.addDataProduct);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [domainId, setDomainId] = useState('');
  const [subdomainId, setSubdomainId] = useState('');
  const [owner, setOwner] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [sla, setSla] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const domain = domainId ? getDomainById(domainId) : null;
  const subdomains = domain ? domain.subdomains : [];

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !domainId || !subdomainId || !owner.trim()) return;
    const id = `dp-new-${Date.now()}`;
    const tags = tagsText.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    addDataProduct({
      id,
      name: name.trim(),
      description: description.trim(),
      domainId,
      subdomainId,
      owner: owner.trim(),
      ownerEmail: ownerEmail.trim() || `${owner.trim().replace(/\s+/g, '.').toLowerCase()}@company.com`,
      sla: sla.trim() || undefined,
      outputPortAssetIds: Array.from(selectedAssetIds),
      tags,
      certified: false,
    });
    setSubmitted(true);
    navigate(`/data-product/${id}`);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Data product created</h1>
        <p className={styles.muted}>Redirecting…</p>
        <Link to="/marketplace">← Marketplace</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link to="/marketplace" style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
          ← Marketplace
        </Link>
      </div>
      <h1 className={styles.title}>Create data product</h1>
      <p className={styles.muted}>Define a new data product and select data assets (can be from any domain).</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
            <CardHeader title="Basic info" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxWidth: 480 }}>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Name</span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Exposure Snapshot" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Description</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Short description" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Domain</span>
                <select value={domainId} onChange={(e) => { setDomainId(e.target.value); setSubdomainId(''); }} required style={{ width: '100%', padding: 'var(--space-2)' }}>
                  <option value="">Select domain…</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Subdomain</span>
                <select value={subdomainId} onChange={(e) => setSubdomainId(e.target.value)} required style={{ width: '100%', padding: 'var(--space-2)' }}>
                  <option value="">Select subdomain…</option>
                  {subdomains.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Owner</span>
                <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} required placeholder="e.g. Jane Risk" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Owner email (optional)</span>
                <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="jane@company.com" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>SLA (optional)</span>
                <input type="text" value={sla} onChange={(e) => setSla(e.target.value)} placeholder="e.g. Daily 06:00 UTC" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
              <label>
                <span className={styles.muted} style={{ display: 'block', marginBottom: 'var(--space-1)' }}>Tags (comma-separated)</span>
                <input type="text" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g. BCBS 239, exposure" style={{ width: '100%', padding: 'var(--space-2)' }} />
              </label>
            </div>
          </Card>
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Card>
            <CardHeader title="Data assets" />
            <p className={styles.muted}>Select assets to expose in this product. Assets can be from any domain.</p>
            <div className={styles.tableWrap} style={{ marginTop: 'var(--space-3)' }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>Include</th>
                    <th>Asset</th>
                    <th>Domain</th>
                    <th>Platform</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <input type="checkbox" checked={selectedAssetIds.has(a.id)} onChange={() => toggleAsset(a.id)} />
                      </td>
                      <td><Link to={`/asset/${a.id}`}>{a.displayName}</Link></td>
                      <td>{getDomainById(a.domainId)?.name ?? a.domainId}</td>
                      <td>{a.platform ?? '—'}</td>
                      <td>{a.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !domainId || !subdomainId || !owner.trim()}
          style={{
            padding: 'var(--space-2) var(--space-4)',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            cursor: !name.trim() || !domainId || !subdomainId || !owner.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Create data product
        </button>
      </form>
    </div>
  );
}
