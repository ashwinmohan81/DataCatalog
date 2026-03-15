import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { personas } from '../data/mock/personas';
import { domains } from '../data/mock/domains';
import styles from './AppShell.module.css';

const NAV = [
  { path: '/catalog', label: 'Catalog' },
  { path: '/marketplace', label: 'Marketplace' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/lineage', label: 'Lineage' },
  { path: '/insights', label: 'Insights' },
  { path: '/glossary', label: 'Glossary' },
  { path: '/tags', label: 'Tags' },
  { path: '/quality', label: 'Quality' },
  { path: '/settings', label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { persona, setPersona, notifications, markNotificationRead, searchQuery, setSearchQuery } = useAppStore();
  const [showNotify, setShowNotify] = useState(false);
  const [showPersona, setShowPersona] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  const currentPersona = personas.find((p) => p.id === persona)!;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className={styles.layout}>
      <header className={styles.topbar}>
        <Link to="/" className={styles.logo}>
          Data Catalog
        </Link>
        <nav className={styles.nav}>
          {NAV.map(({ path, label }) => (
            <Link key={path} to={path} className={styles.navLink}>
              {label}
            </Link>
          ))}
        </nav>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="search"
            placeholder="Search assets, glossary, products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn} aria-label="Search">
            Search
          </button>
        </form>
        <div className={styles.actions}>
          <div className={styles.notifyWrap}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setShowNotify((v) => !v)}
              aria-label="Notifications"
            >
              🔔 {unread > 0 && <span className={styles.badge}>{unread}</span>}
            </button>
            {showNotify && (
              <div className={styles.notifyPanel}>
                {notifications.slice(0, 5).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={styles.notifyItem}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.linkAssetId) navigate(`/asset/${n.linkAssetId}`);
                      if (n.linkTaskId) navigate(`/workflows/task/${n.linkTaskId}`);
                      if (n.linkContractId) navigate(`/contracts/${n.linkContractId}`);
                      setShowNotify(false);
                    }}
                  >
                    <span className={n.read ? styles.notifyRead : ''}>{n.title}</span>
                    <span className={styles.notifyTime}>{new Date(n.at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.personaWrap}>
            <button
              type="button"
              className={styles.personaBtn}
              onClick={() => setShowPersona((v) => !v)}
            >
              {currentPersona.name} ▾
            </button>
            {showPersona && (
              <div className={styles.personaPanel}>
                {personas.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={p.id === persona ? styles.personaActive : ''}
                    onClick={() => {
                      setPersona(p.id);
                      navigate(p.homePath);
                      setShowPersona(false);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Domains</div>
        <DomainTree />
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

function DomainTree() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ 'dom-risk': true, 'dom-customer': true });

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  return (
    <ul className={styles.tree}>
      {domains.map((d) => (
        <li key={d.id}>
          <button type="button" className={styles.treeNode} onClick={() => toggle(d.id)}>
            {expanded[d.id] ? '▼' : '▶'} {d.name}
          </button>
          {expanded[d.id] && (
            <ul className={styles.treeSub}>
              {d.subdomains.map((s) => (
                <li key={s.id}>
                  <span className={styles.treeNode}>{s.name}</span>
                  <ul className={styles.treeSub}>
                    {s.dataProducts.map((dp) => (
                      <li key={dp.id}>
                        <Link to={`/data-product/${dp.id}`} className={styles.treeLink}>
                          {dp.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
