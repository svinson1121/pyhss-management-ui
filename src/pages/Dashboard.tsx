import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ContentHeader } from '@components';
import i18n from '@app/utils/i18n';
import { OamApi, SubscriberApi, AucApi, ImsSubscriberApi } from '../services/pyhss';

interface DiameterPeer {
  IpAddress: string;
  Port: string;
  Hostname: string;
  Connected: boolean;
  LastConnectTimestamp: string;
  LastDisconnectTimestamp: string;
  ReconnectionCount: number;
  Metadata: string;
  [key: string]: any;
}

interface GroupedPeer {
  hostname: string;
  ipAddress: string;
  peerType: string;
  connections: number;
  connectedCount: number;
  lastConnect: string;
  reconnections: number;
}

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

const getPeerType = (metadata: string): string => {
  try {
    const m = JSON.parse(metadata);
    return m.DiameterPeerType || '—';
  } catch { return '—'; }
};

const groupPeers = (peers: DiameterPeer[]): GroupedPeer[] => {
  const map = new Map<string, GroupedPeer>();
  for (const p of peers) {
    const key = p.Hostname;
    if (!map.has(key)) {
      map.set(key, {
        hostname: p.Hostname,
        ipAddress: p.IpAddress,
        peerType: getPeerType(p.Metadata),
        connections: 0,
        connectedCount: 0,
        lastConnect: p.LastConnectTimestamp,
        reconnections: 0,
      });
    }
    const g = map.get(key)!;
    g.connections += 1;
    if (p.Connected) g.connectedCount += 1;
    g.reconnections += p.ReconnectionCount || 0;
    if (p.LastConnectTimestamp > g.lastConnect) g.lastConnect = p.LastConnectTimestamp;
  }
  return Array.from(map.values()).sort((a, b) => b.connectedCount - a.connectedCount);
};

const peerTypeColor: Record<string, string> = {
  pcscf: 'var(--accent)',
  scscf: '#a78bfa',
  icscf: 'var(--accent-amber)',
  dra:   'var(--accent-green)',
};

const PeerRow = ({ peer }: { peer: GroupedPeer }) => {
  const up = peer.connectedCount > 0;
  const color = peerTypeColor[peer.peerType] || 'var(--text-secondary)';
  const ts = peer.lastConnect?.replace('T', ' ').split('.')[0] || '—';
  return (
    <tr style={S.tableRow}>
      <td style={S.tdStatus}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace", color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0, background: up ? 'var(--accent-green)' : 'var(--accent-red)', boxShadow: up ? '0 0 5px rgba(0,230,118,0.7)' : '0 0 5px rgba(255,71,87,0.5)' }} />
          {up ? 'UP' : 'DOWN'}
        </span>
      </td>
      <td style={S.td}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: 'var(--text-primary)' }}>{peer.hostname}</span>
        <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: "'IBM Plex Mono', monospace" }}>{peer.ipAddress}</span>
      </td>
      <td style={S.td}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', background: `${color}18`, color, border: `1px solid ${color}30` }}>
          {peer.peerType}
        </span>
      </td>
      <td style={{ ...S.td, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
        <span style={{ color: up ? 'var(--accent-green)' : 'var(--text-muted)' }}>{peer.connectedCount}</span>
        <span style={{ color: 'var(--border-bright)' }}> / {peer.connections}</span>
      </td>
      <td style={{ ...S.td, color: 'var(--text-muted)', fontSize: '11px', fontFamily: "'IBM Plex Mono', monospace" }}>{ts}</td>
    </tr>
  );
};

const Dashboard = () => {
  const [totalSubs, setTotalSubs] = React.useState('—');
  const [totalAuc, setTotalAuc] = React.useState('—');
  const [totalIms, setTotalIms] = React.useState('—');
  const [activeSubs, setActiveSubs] = React.useState('—');
  const [activeIms, setActiveIms] = React.useState('—');
  const [activePcrf, setActivePcrf] = React.useState('—');
  const [peers, setPeers] = React.useState<DiameterPeer[]>([]);
  const [peersError, setPeersError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState('');
  const [apiOnline, setApiOnline] = React.useState<boolean | null>(null);

  const fetchInventory = () => {
    SubscriberApi.getAll().then(d => setTotalSubs(String(d.data?.length ?? 0))).catch(() => setTotalSubs('—'));
    AucApi.getAll().then(d => setTotalAuc(String(d.data?.length ?? 0))).catch(() => setTotalAuc('—'));
    ImsSubscriberApi.getAll().then(d => setTotalIms(String(d.data?.length ?? 0))).catch(() => setTotalIms('—'));
  };

  const fetchLive = () => {
    setLastUpdated(new Date().toLocaleTimeString());

    OamApi.ping().then(() => setApiOnline(true)).catch(() => setApiOnline(false));

    OamApi.servingSubs()
      .then(d => {
        const entries = Object.values(d.data ?? {}) as any[];
        const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24h window
        const active = entries.filter(s => s.serving_mme_timestamp && new Date(s.serving_mme_timestamp).getTime() > cutoff);
        setActiveSubs(String(active.length));
      })
      .catch(() => setActiveSubs('—'));

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

    OamApi.servingSubsPcrf()
      .then(d => {
        const entries = Object.values(d.data ?? {}) as any[];
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        const active = entries.filter(s => s.serving_pgw_timestamp && new Date(s.serving_pgw_timestamp).getTime() > cutoff);
        setActivePcrf(String(active.length));
      })
      .catch(() => setActivePcrf('—'));

    OamApi.diameterPeers()
      .then(d => {
        const raw = d.data ?? {};
        setPeers(Array.isArray(raw) ? raw : Object.values(raw));
        setPeersError(false);
      })
      .catch(() => { setPeers([]); setPeersError(true); });
  };

  const refreshInterval: number = useSelector((state: any) => state.ui.dashboardRefreshInterval) ?? 15;

  React.useEffect(() => {
    fetchInventory();
    fetchLive();
    const live = setInterval(fetchLive, refreshInterval * 1000);
    const inv = setInterval(fetchInventory, 60_000);
    return () => { clearInterval(live); clearInterval(inv); };
  }, [refreshInterval]);

  const connectedPeers = peers.filter(p => p.Connected).length;
  const groupedPeers = groupPeers(peers);

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
          <span style={S.sectionNote}>database totals · refreshes every 60s</span>
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
          <span style={S.sectionNote}>OAM counters · refreshes every 15s</span>
        </div>
        <div style={{ ...S.grid, marginBottom: '32px' }}>
          <StatCard value={activeSubs} label="Subs Seen (24h)" sublabel="subs with MME contact in last 24h" color="#00e676" icon="fas fa-signal" />
          <StatCard value={activePcrf} label="PCRF Sessions" sublabel="serving_subs_pcrf — active Gx within 24h" color="#00c8ff" icon="fas fa-network-wired" />
          <StatCard value={activeIms} label="IMS Registered" sublabel="serving_subs_ims — IMS registration within 24h" color="#fbbf24" icon="fas fa-phone" />
          <StatCard
            value={peersError ? 'ERR' : String(connectedPeers)}
            label="Diameter Peers Up"
            sublabel={peersError ? 'Could not reach OAM' : `${peers.length} connections · ${groupedPeers.length} hosts`}
            color="#00e676"
            icon="fas fa-project-diagram"
            error={peersError}
          />
        </div>

        {/* Diameter Peers Table */}
        <div style={S.sectionLabel}>
          <i className="fas fa-project-diagram" style={{ marginRight: 8, color: 'var(--text-muted)' }} />
          Diameter Peers
          <span style={S.sectionNote}>live connection state</span>
        </div>
        <div style={S.tableCard}>
          {peers.length === 0 ? (
            <div style={S.empty}>
              {peersError
                ? <><i className="fas fa-exclamation-triangle" style={{ color: 'var(--accent-red)', marginRight: 8 }} />Could not reach OAM endpoint</>
                : <><i className="fas fa-circle-notch fa-spin" style={{ color: 'var(--text-muted)', marginRight: 8 }} />No peers reported</>
              }
            </div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  {['Status', 'Hostname / IP', 'Type', 'Connections', 'Last Connect'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedPeers.map((peer, i) => <PeerRow key={i} peer={peer} />)}
              </tbody>
            </table>
          )}
        </div>

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
