import { useParams, Link } from 'react-router-dom';
import { getDataProductWithContext, getAssetById, getContractById, assets, getDomainById } from '../data/mock';
import { useAppStore } from '../store/useAppStore';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

export function DataProductDetailPage() {
  const { dataProductId } = useParams();
  const runtimeProducts = useAppStore((s) => s.dataProducts);
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
