import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { assets, dqRuns, domains, type DataAsset } from '../data/mock';
import { Card, CardHeader } from '../components/Card';
import { Badge } from '../components/Badge';
import styles from './Page.module.css';

const TIER_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Tier 1 (Key/Golden)',
  2: 'Tier 2 (Standard)',
  3: 'Tier 3 (Supporting)',
};

function healthScore(assetId: string): number {
  const runs = dqRuns.filter((r) => r.assetId === assetId && r.runAt > '2025-03-01');
  if (runs.length === 0) return 100;
  const passed = runs.filter((r) => r.passed).length;
  return Math.round((passed / runs.length) * 100);
}

function glossaryMaturity(assetId: string): number {
  const asset = assets.find((a) => a.id === assetId);
  if (!asset || asset.columns.length === 0) return 100;
  const mapped = asset.columns.filter((c) => c.glossaryTermIds.length > 0).length;
  return Math.round((mapped / asset.columns.length) * 100);
}

function filterAssets(
  list: DataAsset[],
  params: { domain?: string; tier?: string; type?: string; certified?: string; owner?: string; q?: string }
): DataAsset[] {
  let out = list;
  if (params.domain) out = out.filter((a) => a.domainId === params.domain);
  if (params.tier) out = out.filter((a) => a.tier === Number(params.tier));
  if (params.type) out = out.filter((a) => a.type === params.type);
  if (params.certified === 'true') out = out.filter((a) => a.certified);
  if (params.owner) out = out.filter((a) => a.owner === params.owner);
  if (params.q?.trim()) {
    const q = params.q.trim().toLowerCase();
    out = out.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.displayName.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return out;
}

export function InsightsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const domain = searchParams.get('domain') ?? '';
  const tier = searchParams.get('tier') ?? '';
  const type = searchParams.get('type') ?? '';
  const certified = searchParams.get('certified') ?? '';
  const owner = searchParams.get('owner') ?? '';
  const q = searchParams.get('q') ?? '';

  const filteredAssets = useMemo(
    () =>
      filterAssets(assets, {
        domain: domain || undefined,
        tier: tier || undefined,
        type: type || undefined,
        certified: certified || undefined,
        owner: owner || undefined,
        q: q || undefined,
      }),
    [domain, tier, type, certified, owner, q]
  );

  const owners = useMemo(() => Array.from(new Set(assets.map((a) => a.owner))).sort(), []);
  const assetTypes = useMemo(() => Array.from(new Set(assets.map((a) => a.type))).sort(), []);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({});

  const totalAssets = filteredAssets.length;
  const byTier = [1, 2, 3].map((t) => ({
    tier: t,
    label: TIER_LABELS[t as 1 | 2 | 3],
    count: filteredAssets.filter((a) => a.tier === t).length,
  }));
  const tierCounts = { 1: byTier[0].count, 2: byTier[1].count, 3: byTier[2].count };

  const avgGlossary =
    totalAssets > 0
      ? Math.round(filteredAssets.reduce((s, a) => s + glossaryMaturity(a.id), 0) / totalAssets)
      : 0;
  const avgDq =
    totalAssets > 0
      ? Math.round(filteredAssets.reduce((s, a) => s + healthScore(a.id), 0) / totalAssets)
      : 0;

  const byDomain = domains.map((d) => {
    const domainAssets = filteredAssets.filter((a) => a.domainId === d.id);
    const avgGlossaryDomain =
      domainAssets.length > 0
        ? Math.round(domainAssets.reduce((s, a) => s + glossaryMaturity(a.id), 0) / domainAssets.length)
        : 0;
    const avgDqDomain =
      domainAssets.length > 0
        ? Math.round(domainAssets.reduce((s, a) => s + healthScore(a.id), 0) / domainAssets.length)
        : 0;
    return {
      name: d.name,
      assets: domainAssets.length,
      glossaryMaturity: avgGlossaryDomain,
      dqHealth: avgDqDomain,
    };
  });

  const byTierMetrics = [1, 2, 3].map((tier) => {
    const tierAssets = filteredAssets.filter((a) => a.tier === tier);
    const avgGlossaryTier =
      tierAssets.length > 0
        ? Math.round(tierAssets.reduce((s, a) => s + glossaryMaturity(a.id), 0) / tierAssets.length)
        : 0;
    const avgDqTier =
      tierAssets.length > 0
        ? Math.round(tierAssets.reduce((s, a) => s + healthScore(a.id), 0) / tierAssets.length)
        : 0;
    return {
      name: `Tier ${tier}`,
      fullName: TIER_LABELS[tier as 1 | 2 | 3],
      count: tierAssets.length,
      glossaryMaturity: avgGlossaryTier,
      dqHealth: avgDqTier,
    };
  });

  const typeMap = new Map<string, { count: number; glossarySum: number; dqSum: number }>();
  filteredAssets.forEach((a) => {
    const g = glossaryMaturity(a.id);
    const d = healthScore(a.id);
    const existing = typeMap.get(a.type);
    if (existing) {
      existing.count += 1;
      existing.glossarySum += g;
      existing.dqSum += d;
    } else typeMap.set(a.type, { count: 1, glossarySum: g, dqSum: d });
  });
  const byType = Array.from(typeMap.entries()).map(([name, v]) => ({
    name,
    count: v.count,
    glossaryMaturity: Math.round(v.glossarySum / v.count),
    dqHealth: Math.round(v.dqSum / v.count),
  }));

  const pieData = [
    { name: TIER_LABELS[1], value: tierCounts[1], color: 'var(--color-primary)' },
    { name: TIER_LABELS[2], value: tierCounts[2], color: 'var(--color-text-muted)' },
    { name: TIER_LABELS[3], value: tierCounts[3], color: 'var(--color-border)' },
  ].filter((d) => d.value > 0);

  const assetHealthList = filteredAssets.map((a) => ({
    asset: a,
    health: healthScore(a.id),
    glossary: glossaryMaturity(a.id),
  }));

  const dqTrendMock = [
    { week: 'W1 Mar', passRate: 92 },
    { week: 'W2 Mar', passRate: 88 },
    { week: 'W3 Mar', passRate: 91 },
    { week: 'W4 Mar', passRate: 89 },
  ];

  const hasActiveFilters = domain || tier || type || certified || owner || q;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Data asset insights</h1>
      <p className={styles.muted}>KPIs on data assets: glossary mapping maturity, DQ results by dimensions, tier classification. Filter to a subset of the catalog below.</p>

      {/* Filter bar */}
      <Card className={styles.insightsFilterCard}>
        <CardHeader title="Filter data assets" />
        <div className={styles.insightsFilterRow}>
          <input
            type="search"
            placeholder="Search assets..."
            value={q}
            onChange={(e) => updateFilter('q', e.target.value)}
            className={styles.insightsFilterInput}
          />
          <select
            value={domain}
            onChange={(e) => updateFilter('domain', e.target.value)}
            className={styles.insightsFilterSelect}
            aria-label="Domain"
          >
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            value={tier}
            onChange={(e) => updateFilter('tier', e.target.value)}
            className={styles.insightsFilterSelect}
            aria-label="Tier"
          >
            <option value="">All tiers</option>
            <option value="1">Tier 1 (Key/Golden)</option>
            <option value="2">Tier 2 (Standard)</option>
            <option value="3">Tier 3 (Supporting)</option>
          </select>
          <select
            value={type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className={styles.insightsFilterSelect}
            aria-label="Asset type"
          >
            <option value="">All types</option>
            {assetTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={owner}
            onChange={(e) => updateFilter('owner', e.target.value)}
            className={styles.insightsFilterSelect}
            aria-label="Owner"
          >
            <option value="">All owners</option>
            {owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <label className={styles.insightsFilterCheck}>
            <input
              type="checkbox"
              checked={certified === 'true'}
              onChange={(e) => updateFilter('certified', e.target.checked ? 'true' : '')}
            />
            Certified only
          </label>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className={styles.insightsFilterClear}>
              Clear filters
            </button>
          )}
        </div>
        <p className={styles.muted} style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
          Showing {filteredAssets.length} of {assets.length} assets
        </p>
      </Card>

      {/* KPI cards */}
      <div className={styles.insightsKpiGrid}>
        <Card>
          <div className={styles.kpiValue}>{totalAssets}</div>
          <div className={styles.kpiLabel}>Total assets</div>
        </Card>
        <Card>
          <div className={styles.kpiValue}>{tierCounts[1]}</div>
          <div className={styles.kpiLabel}>Tier 1 (Key/Golden)</div>
        </Card>
        <Card>
          <div className={styles.kpiValue}>{tierCounts[2]}</div>
          <div className={styles.kpiLabel}>Tier 2 (Standard)</div>
        </Card>
        <Card>
          <div className={styles.kpiValue}>{tierCounts[3]}</div>
          <div className={styles.kpiLabel}>Tier 3 (Supporting)</div>
        </Card>
        <Card>
          <div className={styles.kpiValue}>{avgGlossary}%</div>
          <div className={styles.kpiLabel}>Avg glossary maturity</div>
        </Card>
        <Card>
          <div className={styles.kpiValue}>{avgDq}%</div>
          <div className={styles.kpiLabel}>Avg DQ health</div>
        </Card>
      </div>

      {/* Key insights dashboards – KPI graphs */}
      <div className={styles.insightsChartsRow}>
        <Card>
          <CardHeader title="Asset distribution by tier" />
          <div className={styles.chartContainer}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.muted}>No data</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Glossary maturity by domain" />
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDomain} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                  labelStyle={{ color: 'var(--color-text)' }}
                />
                <Bar dataKey="glossaryMaturity" name="Maturity %" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className={styles.insightsChartsRow}>
        <Card>
          <CardHeader title="DQ health by domain" />
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byDomain} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                />
                <Bar dataKey="dqHealth" name="DQ health %" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Glossary maturity by tier" />
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byTierMetrics} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                />
                <Bar dataKey="glossaryMaturity" name="Maturity %" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className={styles.insightsChartsRow}>
        <Card>
          <CardHeader title="DQ health by tier" />
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byTierMetrics} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                />
                <Bar dataKey="dqHealth" name="DQ health %" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="DQ pass rate trend (mock)" />
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dqTrendMock} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="week" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                />
                <Line type="monotone" dataKey="passRate" name="Pass %" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: 'var(--color-primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="DQ & glossary by asset type" />
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byType} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
              />
              <Legend />
              <Bar dataKey="glossaryMaturity" name="Glossary %" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="dqHealth" name="DQ health %" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Dimension tables */}
      <Card>
        <CardHeader title="Glossary mapping maturity by dimension" />
        <p className={styles.muted}>By domain, tier, and asset type. Drill down to assets for details.</p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Value</th>
                <th>Assets</th>
                <th>Avg maturity %</th>
              </tr>
            </thead>
            <tbody>
              {byDomain.map((r) => (
                <tr key={`domain-${r.name}`}>
                  <td>Domain</td>
                  <td>{r.name}</td>
                  <td>{r.assets}</td>
                  <td>
                    <Badge variant={r.glossaryMaturity >= 80 ? 'success' : r.glossaryMaturity >= 50 ? 'warning' : 'default'}>
                      {r.glossaryMaturity}%
                    </Badge>
                  </td>
                </tr>
              ))}
              {byTierMetrics.map((r) => (
                <tr key={`tier-${r.name}`}>
                  <td>Tier</td>
                  <td>{r.fullName}</td>
                  <td>{r.count}</td>
                  <td>
                    <Badge variant={r.glossaryMaturity >= 80 ? 'success' : r.glossaryMaturity >= 50 ? 'warning' : 'default'}>
                      {r.glossaryMaturity}%
                    </Badge>
                  </td>
                </tr>
              ))}
              {byType.map((r) => (
                <tr key={`type-${r.name}`}>
                  <td>Asset type</td>
                  <td>{r.name}</td>
                  <td>{r.count}</td>
                  <td>
                    <Badge variant={r.glossaryMaturity >= 80 ? 'success' : r.glossaryMaturity >= 50 ? 'warning' : 'default'}>
                      {r.glossaryMaturity}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="DQ results by dimension" />
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Value</th>
                <th>Assets</th>
                <th>Avg DQ health %</th>
              </tr>
            </thead>
            <tbody>
              {byDomain.map((r) => (
                <tr key={`dq-domain-${r.name}`}>
                  <td>Domain</td>
                  <td>{r.name}</td>
                  <td>{r.assets}</td>
                  <td>
                    <Badge variant={r.dqHealth >= 80 ? 'success' : r.dqHealth >= 50 ? 'warning' : 'error'}>
                      {r.dqHealth}%
                    </Badge>
                  </td>
                </tr>
              ))}
              {byTierMetrics.map((r) => (
                <tr key={`dq-tier-${r.name}`}>
                  <td>Tier</td>
                  <td>{r.fullName}</td>
                  <td>{r.count}</td>
                  <td>
                    <Badge variant={r.dqHealth >= 80 ? 'success' : r.dqHealth >= 50 ? 'warning' : 'error'}>
                      {r.dqHealth}%
                    </Badge>
                  </td>
                </tr>
              ))}
              {byType.map((r) => (
                <tr key={`dq-type-${r.name}`}>
                  <td>Asset type</td>
                  <td>{r.name}</td>
                  <td>{r.count}</td>
                  <td>
                    <Badge variant={r.dqHealth >= 80 ? 'success' : r.dqHealth >= 50 ? 'warning' : 'error'}>
                      {r.dqHealth}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="Assets by tier" />
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Tier</th>
                <th>Glossary maturity</th>
                <th>DQ health</th>
              </tr>
            </thead>
            <tbody>
              {assetHealthList.map(({ asset, health, glossary }) => (
                <tr key={asset.id}>
                  <td><Link to={`/asset/${asset.id}`}>{asset.displayName}</Link></td>
                  <td><Badge variant={asset.tier === 1 ? 'info' : 'default'}>{TIER_LABELS[asset.tier]}</Badge></td>
                  <td>
                    <Badge variant={glossary >= 80 ? 'success' : glossary >= 50 ? 'warning' : 'default'}>{glossary}%</Badge>
                  </td>
                  <td>
                    <Badge variant={health >= 80 ? 'success' : health >= 50 ? 'warning' : 'error'}>{health}%</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
