import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ContentHeader } from '@components';
import i18n from '@app/utils/i18n';
import { OamApi, SubscriberApi, AucApi, ImsSubscriberApi } from '../services/pyhss';



interface StatCardProps {
  value: string | number;
  label: string;
  sublabel: string;
  to?: string;
  color: string;
  icon: string;
  error?: boolean;
}

const StatCard = ({ value, label, sublabel, to, color, icon, error }: StatCardProps) => {
  const card = (
    <div style={{ ...S.card, borderLeftColor: error ? 'var(--accent-red)' : color }}>
      <div style={S.cardTop}>
        <div style={{ flex: 1 }}>
          <div style={{ ...S.cardValue, color: error ? 'var(--accent-red)' : color }}>{value}</div>
          <div style={S.cardLabel}>{label}</div>
          <div style={S.cardSub}>{sublabel}</div>
        </div>
        <div style={{ ...S.cardIcon, color: error ? 'var(--accent-red)' : color, background: `${error ? 'var(--accent-red)' : color}12` }}>
          <i className={icon} />
        </div>
      </div>
      {to && (
        <div style={S.cardFooter}>
          <span style={S.cardFooterText}>
            View records <i className="fas fa-arrow-right" style={{ fontSize: 9, marginLeft: 4 }} />
          </span>
        </div>
      )}
    </div>
  );
  return to ? (
    <NavLink to={to} style={{ textDecoration: 'none', display: 'block' }}>{card}</NavLink>
  ) : card;
};


// ── Prometheus / PromQL helpers ───────────────────────────────────────────────
interface PromResult {
  metric: Record<string, string>;
  value: [number, string];
}

const promQuery = async (baseUrl: string, query: string): Promise<PromResult[]> => {
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/query?query=${encodeURIComponent(query)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (j.status !== 'success') throw new Error(j.error || 'PromQL error');
  return j.data?.result ?? [];
};

// ── Diameter Metrics Section ──────────────────────────────────────────────────
const DiameterMetrics = ({ refreshTick, metricsEnabled }: { refreshTick: number; metricsEnabled: boolean }) => {
  const [data, setData] = React.useState<{
    reqCount: PromResult[];
    respCount: PromResult[];
    authEvents: PromResult[];
    hostReqs: PromResult[];
    hostResps: PromResult[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const prometheusUrl = localStorage.getItem('metricsUrl') || '';

  React.useEffect(() => {
    if (!prometheusUrl || !metricsEnabled) return;
    setError(null);
    setLoading(true);
    Promise.all([
      promQuery(prometheusUrl, 'prom_diam_request_count{benchmark_interval="3600"}'),
      promQuery(prometheusUrl, 'prom_diam_response_count{benchmark_interval="3600"}'),
      promQuery(prometheusUrl, 'prom_diam_auth_event_count_total'),
      promQuery(prometheusUrl, 'prom_diam_request_count_host'),
      promQuery(prometheusUrl, 'prom_diam_response_count_host'),
    ])
      .then(([reqCount, respCount, authEvents, hostReqs, hostResps]) => {
        setData({ reqCount, respCount, authEvents, hostReqs, hostResps });
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [prometheusUrl, metricsEnabled, refreshTick]);

  if (!prometheusUrl || !metricsEnabled) return null;

  if (error) return (
    <>
      <div style={S.sectionLabel}>
        <i className="fas fa-chart-bar" style={{ marginRight: 8, color: 'var(--text-muted)' }} />
        Diameter Metrics
      </div>
      <div style={{ ...S.tableCard, marginBottom: 32 }}>
        <div style={S.empty}>
          <i className="fas fa-exclamation-triangle" style={{ color: 'var(--accent-red)', marginRight: 8 }} />
          Could not reach Prometheus — {error}
        </div>
      </div>
    </>
  );

  if (loading || !data) return (
    <>
      <div style={S.sectionLabel}>
        <i className="fas fa-chart-bar" style={{ marginRight: 8, color: 'var(--text-muted)' }} />
        Diameter Metrics
      </div>
      <div style={{ ...S.tableCard, marginBottom: 32 }}>
        <div style={S.empty}><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />Querying Prometheus…</div>
      </div>
    </>
  );

  const totalReqs  = data.reqCount[0]  ? parseFloat(data.reqCount[0].value[1])  : null;
  const totalResps = data.respCount[0] ? parseFloat(data.respCount[0].value[1]) : null;
  const reqPerSec  = totalReqs  !== null ? (totalReqs  / 3600).toFixed(2) : '—';
  const respPerSec = totalResps !== null ? (totalResps / 3600).toFixed(2) : '—';
  const totalAuthFails = data.authEvents.reduce((a, r) => a + parseFloat(r.value[1]), 0);

  return (
    <>
      <div style={S.sectionLabel}>
        <i className="fas fa-chart-bar" style={{ marginRight: 8, color: 'var(--text-muted)' }} />
        Diameter Metrics
      </div>

      {/* Throughput cards */}
      <div style={{ ...S.grid, marginBottom: 28 }}>
        <div style={{ ...S.card, borderLeftColor: 'var(--accent)' }}>
          <div style={S.cardTop}>
            <div style={{ flex: 1 }}>
              <div style={{ ...S.cardValue, color: 'var(--accent)' }}>{reqPerSec}</div>
              <div style={S.cardLabel}>Requests / sec</div>
              <div style={S.cardSub}>avg over 3600s · total {totalReqs?.toLocaleString() ?? '—'}</div>
            </div>
            <div style={{ ...S.cardIcon, color: 'var(--accent)', background: 'rgba(0,200,255,0.08)' }}>
              <i className="fas fa-arrow-down" />
            </div>
          </div>
        </div>
        <div style={{ ...S.card, borderLeftColor: 'var(--accent-green)' }}>
          <div style={S.cardTop}>
            <div style={{ flex: 1 }}>
              <div style={{ ...S.cardValue, color: 'var(--accent-green)' }}>{respPerSec}</div>
              <div style={S.cardLabel}>Responses / sec</div>
              <div style={S.cardSub}>avg over 3600s · total {totalResps?.toLocaleString() ?? '—'}</div>
            </div>
            <div style={{ ...S.cardIcon, color: 'var(--accent-green)', background: 'rgba(0,230,118,0.08)' }}>
              <i className="fas fa-arrow-up" />
            </div>
          </div>
        </div>
        {data.authEvents.length > 0 && (
          <NavLink to="/oam" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ ...S.card, borderLeftColor: 'var(--accent-red)' }}>
              <div style={S.cardTop}>
                <div style={{ flex: 1 }}>
                  <div style={{ ...S.cardValue, color: 'var(--accent-red)' }}>{totalAuthFails}</div>
                  <div style={S.cardLabel}>Auth Failures</div>
                  <div style={S.cardSub}>view breakdown on OAM page</div>
                </div>
                <div style={{ ...S.cardIcon, color: 'var(--accent-red)', background: 'rgba(255,71,87,0.08)' }}>
                  <i className="fas fa-user-slash" />
                </div>
              </div>
            </div>
          </NavLink>
        )}
      </div>
    </>
  );
};

const Dashboard = () => {
  const [totalSubs, setTotalSubs] = React.useState('—');
  const [totalAuc, setTotalAuc] = React.useState('—');
  const [totalIms, setTotalIms] = React.useState('—');
  const [activeIms, setActiveIms] = React.useState('—');
  const [peersUp, setPeersUp] = React.useState('—');
  const [lastUpdated, setLastUpdated] = React.useState('');
  const [apiOnline, setApiOnline] = React.useState<boolean | null>(null);
  const [refreshTick, setRefreshTick] = React.useState(0);

  const fetchInventory = () => {
    SubscriberApi.getAll().then(d => setTotalSubs(String(d.data?.length ?? 0))).catch(() => setTotalSubs('—'));
    AucApi.getAll().then(d => setTotalAuc(String(d.data?.length ?? 0))).catch(() => setTotalAuc('—'));
    ImsSubscriberApi.getAll().then(d => setTotalIms(String(d.data?.length ?? 0))).catch(() => setTotalIms('—'));
  };

  const fetchLive = () => {
    setLastUpdated(new Date().toLocaleTimeString());
    setRefreshTick(t => t + 1);

    OamApi.ping().then(() => setApiOnline(true)).catch(() => setApiOnline(false));

    OamApi.diameterPeers()
      .then(d => {
        const raw = d.data ?? {};
        const list: any[] = Array.isArray(raw) ? raw : Object.values(raw);
        setPeersUp(String(list.length));
      })
      .catch(() => setPeersUp('—'));


    OamApi.servingSubsIms()
      .then(d => {
        const entries = Object.values(d.data ?? {}) as any[];
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const active = entries.filter(s =>
          (s.pcscf_timestamp && new Date(s.pcscf_timestamp).getTime() > cutoff) ||
          (s.scscf_timestamp && new Date(s.scscf_timestamp).getTime() > cutoff)
        );
        setActiveIms(String(active.length));
      })
      .catch(() => setActiveIms('—'));


  };

  const refreshInterval: number = useSelector((state: any) => state.ui.dashboardRefreshInterval) ?? 15;
  const metricsEnabled: boolean = useSelector((state: any) => state.ui.metricsEnabled) ?? true;

  React.useEffect(() => {
    fetchInventory();
    fetchLive();
    const live = setInterval(fetchLive, refreshInterval * 1000);
    const inv = setInterval(fetchInventory, 60_000);
    return () => { clearInterval(live); clearInterval(inv); };
  }, [refreshInterval]);


  return (
    <div style={S.page}>
      <ContentHeader title="Dashboard" />
      <div style={S.body}>

        {/* Status bar */}
        <div style={S.statusBar}>
          <span style={{ ...S.dot, background: apiOnline === false ? 'var(--accent-red)' : 'var(--accent-green)', boxShadow: apiOnline === false ? '0 0 6px rgba(255,71,87,0.8)' : '0 0 6px rgba(0,230,118,0.8)' }} />
          <span>{apiOnline === null ? 'Connecting…' : apiOnline ? 'API Connected' : 'API Unreachable'}</span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span>Refreshes every {refreshInterval >= 60 ? `${refreshInterval / 60}m` : `${refreshInterval}s`}</span>
          {lastUpdated && <span style={{ marginLeft: 'auto', color: 'var(--border-bright)' }}>Updated {lastUpdated}</span>}
        </div>

        {/* Provisioned Inventory */}
        <div style={S.sectionLabel}>
          <i className="fas fa-database" style={{ marginRight: 8, color: 'var(--text-muted)' }} />
          Provisioned Inventory
          
        </div>
        <div style={{ ...S.grid, marginBottom: '28px' }}>
          <StatCard value={totalSubs} label="Subscribers" sublabel="Total provisioned in DB" to="/subscriber" color="#00c8ff" icon="fas fa-users" />
          <StatCard value={totalAuc} label="AUC Records" sublabel="SIM credentials provisioned" to="/auc" color="#a78bfa" icon="fas fa-sim-card" />
          <StatCard value={totalIms} label="IMS Subscribers" sublabel="IMS profiles provisioned" to="/imssubscriber" color="#fbbf24" icon="fas fa-user-tie" />
        </div>

        {/* Live Session State */}
        <div style={S.sectionLabel}>
          <i className="fas fa-broadcast-tower" style={{ marginRight: 8, color: 'var(--text-muted)' }} />
          Live Session State
          
        </div>
        <div style={{ ...S.grid, marginBottom: '32px' }}>
          <StatCard value={activeIms} label="IMS Registered" sublabel="IMS registrations · live OAM state" color="#fbbf24" icon="fas fa-phone" />
          <StatCard
            value={peersUp}
            label="Diameter Peers"
            sublabel="active peers · click to view on OAM"
            to="/oam"
            color="#00e676"
            icon="fas fa-project-diagram"
          />
        </div>

        {/* Diameter Metrics */}
        <DiameterMetrics refreshTick={refreshTick} metricsEnabled={metricsEnabled} />

      </div>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Inter', sans-serif" },
  body: { padding: '20px 0' },
  statusBar: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-muted)' },
  dot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
  sectionLabel: { display: 'flex', alignItems: 'center', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' },
  sectionNote: { marginLeft: '10px', fontSize: '10px', color: 'var(--border-bright)', fontWeight: 400, letterSpacing: '0.05em', textTransform: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  card: { background: 'var(--bg-card)', border: '1px solid #1e2d45', borderLeft: '3px solid #00c8ff', borderRadius: '10px', overflow: 'hidden', transition: 'all 0.15s ease' },
  cardTop: { padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' },
  cardValue: { fontFamily: "'Syne', sans-serif", fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 },
  cardLabel: { fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '6px' },
  cardSub: { fontSize: '10px', color: 'var(--border-bright)', marginTop: '3px', fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.4 },
  cardIcon: { width: '40px', height: '40px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 },
  cardFooter: { padding: '9px 20px', borderTop: '1px solid #1e2d45', background: 'rgba(0,0,0,0.15)' },
  cardFooterText: { fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em' },
  tableCard: { background: 'var(--bg-card)', border: '1px solid #1e2d45', borderRadius: '10px', overflow: 'hidden', marginBottom: '32px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 16px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'left', borderBottom: '1px solid #1e2d45', background: 'rgba(0,0,0,0.2)' },
  tableRow: { borderBottom: '1px solid #111a2a' },
  td: { padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)', verticalAlign: 'middle' },
  tdStatus: { padding: '12px 16px', verticalAlign: 'middle', width: '90px' },
  empty: { padding: '32px 20px', textAlign: 'center', fontSize: '12px', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-muted)' },
};

export default Dashboard;
