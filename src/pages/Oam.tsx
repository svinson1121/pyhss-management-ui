import React from 'react';
import { ContentHeader } from '@components';
import { OamApi } from '../services/pyhss';
import { toast } from 'react-toastify';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpLog {
  id: number;
  operation: string;
  last_modified: string;
  table_name: string;
  item_id: number;
  operation_id: string;
  changes: string;
  timestamp: string;
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHANGE_RE = new RegExp('^(\\w+):\\s+\\[.*?\\]\\s+(.*?)\\s+---->\\s+\\[.*?\\]\\s+([\\s\\S]*)$');

const parseChanges = (raw: string): Array<{ field: string; from: string; to: string }> => {
  if (!raw) return [];
  return raw
    .split(/\r?\n\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.startsWith('last_modified:'))
    .map(line => {
      const m = line.match(CHANGE_RE);
      if (!m) return null;
      const [, field, from, to] = m;
      return {
        field,
        from: from.trim() === 'None' ? '∅' : from.trim(),
        to: to.trim() === 'None' ? '∅' : to.trim(),
      };
    })
    .filter(Boolean) as Array<{ field: string; from: string; to: string }>;
};

const truncate = (s: string, n = 48) => s.length > n ? s.slice(0, n) + '…' : s;

const getPeerType = (metadata: string): string => {
  try { return JSON.parse(metadata)?.DiameterPeerType || '—'; }
  catch { return '—'; }
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
        connections: 0, connectedCount: 0,
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

const opBadgeColor: Record<string, string> = {
  INSERT: 'var(--accent-green)',
  UPDATE: 'var(--accent)',
  DELETE: 'var(--accent-red)',
};

const peerTypeColor: Record<string, string> = {
  pcscf: 'var(--accent)',
  scscf: '#a78bfa',
  icscf: '#fbbf24',
  dra: 'var(--accent-green)',
};

const fmtTs = (ts: string) =>
  ts ? ts.replace('T', ' ').split('.')[0] : '—';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, note, children }: {
  icon: string; title: string; note?: string; children?: React.ReactNode;
}) => (
  <div style={S.sectionHeader}>
    <i className={icon} style={{ color: 'var(--text-muted)', marginRight: 8 }} />
    <span>{title}</span>
    {note && <span style={S.sectionNote}>{note}</span>}
    {children}
  </div>
);

const Badge = ({ label, color }: { label: string; color: string }) => (
  <span style={{
    display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
    fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const,
    background: `${color}18`, color, border: `1px solid ${color}30`,
  }}>
    {label}
  </span>
);

// ─── Operation Logs Section ───────────────────────────────────────────────────

const OperationLogs = () => {
  const [logs, setLogs] = React.useState<OpLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [rollbackingId, setRollbackingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);
  const [tableFilter, setTableFilter] = React.useState('');
  const [opFilter, setOpFilter] = React.useState('');

  const fetchLogs = () => {
    setLoading(true);
    OamApi.operationLogs(0, 20)
      .then(d => {
        const raw = d.data;
        // Handle both plain array and paginated wrapper {items:[...]} or {results:[...]}
        const list: OpLog[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.results)
          ? raw.results
          : [];
        setLogs(list);
      })
      .catch(() => { setLogs([]); toast.error('Failed to load operation logs'); })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { fetchLogs(); }, []);

  const doRollback = (operationId: string, label: string) => {
    if (!window.confirm(`Rollback:\n${label}\n\nThis will reverse the operation. Continue?`)) return;
    setRollbackingId(operationId);
    OamApi.rollback(operationId)
      .then(() => { toast.success('Rollback successful'); fetchLogs(); })
      .catch(() => toast.error('Rollback failed'))
      .finally(() => setRollbackingId(null));
  };

  const doRollbackLast = () => {
    if (logs.length === 0) return;
    const last = logs[0];
    const label = `${last.operation} on ${last.table_name} #${last.item_id}`;
    if (!window.confirm(`Rollback last operation:\n${label}\n\nContinue?`)) return;
    setRollbackingId('__last__');
    OamApi.rollbackLast()
      .then(() => { toast.success('Last operation rolled back'); fetchLogs(); })
      .catch(() => toast.error('Rollback failed'))
      .finally(() => setRollbackingId(null));
  };

  const tables = Array.from(new Set(logs.map(l => l.table_name))).sort();
  const filtered = logs.filter(l =>
    (!tableFilter || l.table_name === tableFilter) &&
    (!opFilter || l.operation === opFilter)
  );

  return (
    <div style={S.section}>
      <SectionHeader icon="fas fa-history" title="Operation Logs" note={`last 50 changes`}>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Table filter */}
          <select
            value={tableFilter}
            onChange={e => setTableFilter(e.target.value)}
            style={S.filterSelect}
          >
            <option value="">All tables</option>
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {/* Op filter */}
          <select
            value={opFilter}
            onChange={e => setOpFilter(e.target.value)}
            style={S.filterSelect}
          >
            <option value="">All ops</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <button onClick={fetchLogs} disabled={loading} style={S.btnSecondary}>
            <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`} style={{ marginRight: 5 }} />
            Refresh
          </button>
          <button
            onClick={doRollbackLast}
            disabled={rollbackingId !== null || logs.length === 0}
            style={{ ...S.btnDanger, opacity: rollbackingId ? 0.5 : 1 }}
          >
            <i className="fas fa-undo" style={{ marginRight: 5 }} />
            Rollback Last
          </button>
        </div>
      </SectionHeader>

      <div style={S.tableCard}>
        {loading && filtered.length === 0 ? (
          <div style={S.empty}><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>No operations found</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Time', 'Op', 'Table', 'ID', 'Changes', ''].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(op => {
                const color = opBadgeColor[op.operation] || 'var(--text-muted)';
                const changes = parseChanges(op.changes);
                const isExpanded = expandedId === op.id;
                const isRolling = rollbackingId === op.operation_id;
                return (
                  <React.Fragment key={op.id}>
                    <tr
                      style={{ ...S.tableRow, cursor: 'pointer', background: isExpanded ? 'rgba(0,200,255,0.03)' : undefined }}
                      onClick={() => setExpandedId(isExpanded ? null : op.id)}
                    >
                      <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' as const }}>
                        {fmtTs(op.timestamp)}
                      </td>
                      <td style={S.td}><Badge label={op.operation} color={color} /></td>
                      <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {op.table_name}
                      </td>
                      <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                        #{op.item_id}
                      </td>
                      <td style={{ ...S.td, fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {changes.map(c => `${c.field}: ${truncate(c.from)} → ${truncate(c.to)}`).join(' · ')}
                      </td>
                      <td style={{ ...S.td, textAlign: 'right' as const }}>
                        <button
                          onClick={e => { e.stopPropagation(); doRollback(op.operation_id, `${op.operation} on ${op.table_name} #${op.item_id}`); }}
                          disabled={rollbackingId !== null}
                          style={{ ...S.btnDanger, padding: '3px 9px', fontSize: '11px', opacity: rollbackingId ? 0.5 : 1 }}
                        >
                          {isRolling
                            ? <i className="fas fa-circle-notch fa-spin" />
                            : <><i className="fas fa-undo" style={{ marginRight: 4 }} />Rollback</>
                          }
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr style={{ background: 'rgba(0,200,255,0.03)' }}>
                        <td colSpan={6} style={{ padding: '0 16px 14px 16px' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: 6, paddingTop: 8 }}>
                            operation_id: <span style={{ color: 'var(--text-secondary)' }}>{op.operation_id}</span>
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                            <thead>
                              <tr>
                                {['Field', 'Before', 'After'].map(h => (
                                  <th key={h} style={{ ...S.th, background: 'var(--bg-base)', fontSize: '10px' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {changes.map((c, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                  <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', width: '20%' }}>{c.field}</td>
                                  <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-red)', wordBreak: 'break-all' as const }}>{c.from}</td>
                                  <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent-green)', wordBreak: 'break-all' as const }}>{c.to}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── Diameter Peers Section ───────────────────────────────────────────────────

const DiameterPeers = () => {
  const [peers, setPeers] = React.useState<GroupedPeer[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const fetchPeers = () => {
    setLoading(true);
    OamApi.diameterPeers()
      .then(d => {
        const raw = d.data ?? {};
        const list: DiameterPeer[] = Array.isArray(raw) ? raw : Object.values(raw);
        setPeers(groupPeers(list));
        setError(false);
      })
      .catch(() => { setPeers([]); setError(true); })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { fetchPeers(); }, []);

  const upCount = peers.filter(p => p.connectedCount > 0).length;

  return (
    <div style={S.section}>
      <SectionHeader icon="fas fa-project-diagram" title="Diameter Peers" note={`${upCount} / ${peers.length} hosts up`}>
        <button onClick={fetchPeers} disabled={loading} style={{ ...S.btnSecondary, marginLeft: 'auto' }}>
          <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`} style={{ marginRight: 5 }} />
          Refresh
        </button>
      </SectionHeader>
      <div style={S.tableCard}>
        {loading && peers.length === 0 ? (
          <div style={S.empty}><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />Loading…</div>
        ) : error ? (
          <div style={S.empty}><i className="fas fa-exclamation-triangle" style={{ color: 'var(--accent-red)', marginRight: 8 }} />Could not reach OAM endpoint</div>
        ) : peers.length === 0 ? (
          <div style={S.empty}>No peers reported</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                {['Status', 'Hostname / IP', 'Type', 'Connections', 'Reconnections', 'Last Connect'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {peers.map((peer, i) => {
                const up = peer.connectedCount > 0;
                const color = peerTypeColor[peer.peerType] || 'var(--text-secondary)';
                return (
                  <tr key={i} style={S.tableRow}>
                    <td style={S.td}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '11px', fontFamily: 'var(--font-mono)', color: up ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: up ? 'var(--accent-green)' : 'var(--accent-red)', boxShadow: up ? '0 0 5px rgba(0,230,118,0.7)' : '0 0 5px rgba(255,71,87,0.5)' }} />
                        {up ? 'UP' : 'DOWN'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-primary)' }}>{peer.hostname}</span>
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{peer.ipAddress}</span>
                    </td>
                    <td style={S.td}><Badge label={peer.peerType} color={color} /></td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      <span style={{ color: up ? 'var(--accent-green)' : 'var(--text-muted)' }}>{peer.connectedCount}</span>
                      <span style={{ color: 'var(--border-bright)' }}> / {peer.connections}</span>
                    </td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>{peer.reconnections}</td>
                    <td style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{fmtTs(peer.lastConnect)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── GeoRed Section ───────────────────────────────────────────────────────────

const GeoRed = () => {
  const [peers, setPeers] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [enabled, setEnabled] = React.useState<boolean | null>(null);

  const fetchPeers = () => {
    setLoading(true);
    OamApi.georedPeers()
      .then(d => {
        const data = d.data;
        if (data?.result === 'Failed') {
          setEnabled(false);
          setPeers(null);
        } else {
          setEnabled(true);
          setPeers(data);
        }
      })
      .catch(() => { setEnabled(false); setPeers(null); })
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { fetchPeers(); }, []);

  const renderPeers = () => {
    if (!peers) return null;
    // peers could be an array or object — normalise to array of entries
    const rows: any[] = Array.isArray(peers) ? peers : Object.entries(peers).map(([k, v]) => ({ peer: k, ...(typeof v === 'object' ? v as any : { status: v }) }));
    if (rows.length === 0) return <div style={S.empty}>No GeoRed peers configured</div>;
    const cols = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    return (
      <table style={S.table}>
        <thead>
          <tr>{cols.map(c => <th key={c} style={S.th}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={S.tableRow}>
              {cols.map(c => (
                <td key={c} style={{ ...S.td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {String(r[c] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={S.section}>
      <SectionHeader icon="fas fa-shield-alt" title="Geographic Redundancy" note="geored peer state">
        <button onClick={fetchPeers} disabled={loading} style={{ ...S.btnSecondary, marginLeft: 'auto' }}>
          <i className={`fas fa-sync${loading ? ' fa-spin' : ''}`} style={{ marginRight: 5 }} />
          Refresh
        </button>
      </SectionHeader>
      <div style={S.tableCard}>
        {loading ? (
          <div style={S.empty}><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 8 }} />Loading…</div>
        ) : enabled === false ? (
          <div style={S.empty}>
            <i className="fas fa-exclamation-triangle" style={{ color: 'var(--accent-red)', marginRight: 8 }} />
            GeoRed is not enabled on this HSS
          </div>
        ) : (
          renderPeers()
        )}
      </div>
    </div>
  );
};

// ─── Reconcile / Deregister Section ──────────────────────────────────────────

const ReconcileDeregister = () => {
  const [imsi, setImsi] = React.useState('');
  const [reconcileLoading, setReconcileLoading] = React.useState(false);
  const [deregLoading, setDeregLoading] = React.useState(false);
  const [reconcileResult, setReconcileResult] = React.useState<any>(null);
  const [deregResult, setDeregResult] = React.useState<any>(null);

  const doReconcile = () => {
    const val = imsi.trim();
    if (!val) { toast.warn('Enter an IMSI first'); return; }
    setReconcileLoading(true);
    setReconcileResult(null);
    OamApi.reconcile(val)
      .then(d => { setReconcileResult({ ok: true, data: d.data }); toast.success(`Reconcile complete for ${val}`); })
      .catch(e => { setReconcileResult({ ok: false, data: e?.response?.data || 'Request failed' }); toast.error('Reconcile failed'); })
      .finally(() => setReconcileLoading(false));
  };

  const doDeregister = () => {
    const val = imsi.trim();
    if (!val) { toast.warn('Enter an IMSI first'); return; }
    if (!window.confirm(`Deregister IMSI ${val}?\n\nThis will force a session teardown.`)) return;
    setDeregLoading(true);
    setDeregResult(null);
    OamApi.deregister(val)
      .then(d => { setDeregResult({ ok: true, data: d.data }); toast.success(`Deregistered ${val}`); })
      .catch(e => { setDeregResult({ ok: false, data: e?.response?.data || 'Request failed' }); toast.error('Deregister failed'); })
      .finally(() => setDeregLoading(false));
  };

  const isLoading = reconcileLoading || deregLoading;

  return (
    <div style={S.section}>
      <SectionHeader icon="fas fa-tools" title="Subscriber Tools" note="reconcile · deregister" />
      <div style={S.card}>
        <div style={{ marginBottom: 16 }}>
          <label style={S.inputLabel}>IMSI</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={imsi}
              onChange={e => setImsi(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doReconcile()}
              placeholder="e.g. 001010123456789"
              style={S.input}
            />
            <button onClick={doReconcile} disabled={isLoading} style={{ ...S.btnSecondary, minWidth: 110, opacity: isLoading ? 0.6 : 1 }}>
              {reconcileLoading
                ? <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 5 }} />Working…</>
                : <><i className="fas fa-sync-alt" style={{ marginRight: 5 }} />Reconcile</>
              }
            </button>
            <button onClick={doDeregister} disabled={isLoading} style={{ ...S.btnDanger, minWidth: 120, opacity: isLoading ? 0.6 : 1 }}>
              {deregLoading
                ? <><i className="fas fa-circle-notch fa-spin" style={{ marginRight: 5 }} />Working…</>
                : <><i className="fas fa-user-times" style={{ marginRight: 5 }} />Deregister</>
              }
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Reconcile re-syncs subscriber state from HSS. Deregister forces a session teardown.
          </div>
        </div>

        {(reconcileResult || deregResult) && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            {reconcileResult && (
              <ResultBox label="Reconcile Result" result={reconcileResult} onClear={() => setReconcileResult(null)} />
            )}
            {deregResult && (
              <ResultBox label="Deregister Result" result={deregResult} onClear={() => setDeregResult(null)} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ResultBox = ({ label, result, onClear }: { label: string; result: { ok: boolean; data: any }; onClear: () => void }) => (
  <div style={{ flex: 1, minWidth: 260, background: 'var(--bg-base)', border: `1px solid ${result.ok ? 'rgba(0,230,118,0.2)' : 'rgba(255,71,87,0.2)'}`, borderRadius: 8, padding: '12px 14px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: result.ok ? 'var(--accent-green)' : 'var(--accent-red)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>
        {label}
      </span>
      <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, padding: 0 }}>
        <i className="fas fa-times" />
      </button>
    </div>
    <pre style={{ margin: 0, fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const, maxHeight: 160, overflowY: 'auto' as const }}>
      {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
    </pre>
  </div>
);

// ─── Main OAM Page ────────────────────────────────────────────────────────────

const Oam = () => {
  return (
    <div style={{ fontFamily: 'var(--font-ui)' }}>
      <ContentHeader title="OAM" />
      <div style={{ padding: '20px 0' }}>
        <OperationLogs />
        <DiameterPeers />
        <GeoRed />
        <ReconcileDeregister />
      </div>
    </div>
  );
};

export default Oam;

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  sectionNote: {
    marginLeft: 10,
    fontSize: '10px',
    color: 'var(--border-bright)',
    fontWeight: 400,
    letterSpacing: '0.05em',
    textTransform: 'none',
  },
  tableCard: {
    background: 'var(--bg-card)',
    border: '1px solid #1e2d45',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 4,
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid #1e2d45',
    borderRadius: 10,
    padding: '18px 20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid #1e2d45',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontSize: '13px',
    verticalAlign: 'middle',
  },
  tableRow: {
    borderBottom: '1px solid #111a2a',
    transition: 'background 0.1s ease',
  },
  empty: {
    padding: '32px 20px',
    textAlign: 'center',
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)',
  },
  filterSelect: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-bright)',
    borderRadius: 5,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '4px 8px',
    cursor: 'pointer',
  },
  input: {
    flex: 1,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-bright)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    padding: '8px 12px',
    outline: 'none',
  },
  inputLabel: {
    display: 'block',
    fontSize: '10px',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 8,
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    background: 'rgba(0,200,255,0.08)',
    border: '1px solid rgba(0,200,255,0.2)',
    borderRadius: 6,
    color: 'var(--accent)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnDanger: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    background: 'rgba(255,71,87,0.08)',
    border: '1px solid rgba(255,71,87,0.25)',
    borderRadius: 6,
    color: 'var(--accent-red)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
};
