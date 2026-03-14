import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { applications } from '../data/mock';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

export function InventoryPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'producer' | 'consumer'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let list = applications;
    if (typeFilter !== 'all') list = list.filter((a) => a.type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.owner.toLowerCase().includes(q)
      );
    }
    return list;
  }, [typeFilter, searchQuery]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Inventory</h1>
      <p className={styles.muted}>Browse by application. Producers own physical data assets; consumers use data products.</p>

      <div className={styles.insightsFilterRow} style={{ marginBottom: 'var(--space-4)' }}>
        <input
          type="search"
          placeholder="Search applications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.insightsFilterInput}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'producer' | 'consumer')}
          className={styles.insightsFilterSelect}
          aria-label="Application type"
        >
          <option value="all">All types</option>
          <option value="producer">Producer</option>
          <option value="consumer">Consumer</option>
        </select>
        <Link to="/inventory/medallion" className={styles.lineageColumnTab} style={{ textDecoration: 'none' }}>
          Medallion view
        </Link>
      </div>

      <ul className={styles.resultList}>
        {filtered.map((app) => (
          <li key={app.id}>
            <Link to={`/inventory/application/${app.id}`} className={styles.resultLink}>
              <span className={styles.resultName}>{app.name}</span>
              <span className={styles.resultMeta}>{app.description}</span>
              <span style={{ marginTop: 'var(--space-1)', display: 'flex', gap: 'var(--space-2)' }}>
                <Badge variant={app.type === 'producer' ? 'info' : 'default'}>
                  {app.type === 'producer' ? 'Producer' : 'Consumer'}
                </Badge>
                <span className={styles.muted}>{app.owner}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
