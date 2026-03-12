import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleControlSidebar, toggleDarkMode, toggleSidebarMenu, setDashboardRefresh, toggleMetrics, REFRESH_OPTIONS, RefreshInterval } from '@app/store/reducers/ui';
import { toast } from 'react-toastify';

interface ControlSidebarProps {
  collapsed?: boolean;
  width?: number;
}

const ControlSidebar = ({ collapsed = true, width = 280 }: ControlSidebarProps) => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state: any) => state.ui.darkMode);
  const menuSidebarCollapsed = useSelector((state: any) => state.ui.menuSidebarCollapsed);
  const refreshInterval = useSelector((state: any) => state.ui.dashboardRefreshInterval) as RefreshInterval;
  const metricsEnabled = useSelector((state: any) => state.ui.metricsEnabled);

  const refreshLabels: Record<number, string> = { 15: '15s', 30: '30s', 60: '1m', 300: '5m' };

  const [apiUrl, setApiUrl] = React.useState(() => localStorage.getItem('api') || 'http://localhost:8080');
  const [apiKey, setApiKey] = React.useState(() => localStorage.getItem('token') || '');
  const [metricsUrl, setMetricsUrl] = React.useState(() => localStorage.getItem('metricsUrl') || '');

  const saveConnection = () => {
    localStorage.setItem('api', apiUrl.trim());
    localStorage.setItem('token', apiKey.trim());
    localStorage.setItem('metricsUrl', metricsUrl.trim());
    toast.success('Connection settings saved');
  };

  return (
    <aside style={{
      ...styles.sidebar,
      width,
      right: collapsed ? -width : 0,
    }}>
      <div style={styles.header}>
        <span style={styles.title}>Settings</span>
        <button
          style={styles.closeBtn}
          onClick={() => dispatch(toggleControlSidebar())}
          title="Close settings"
        >
          <i className="fas fa-times" />
        </button>
      </div>

      <div style={styles.body}>
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Appearance</div>

          <div style={styles.row}>
            <div>
              <div style={styles.optionLabel}>Theme</div>
              <div style={styles.optionDesc}>{darkMode ? 'Dark mode' : 'Light mode'}</div>
            </div>
            <div style={styles.themeToggle}>
              <button
                style={{ ...styles.themeBtn, ...(darkMode ? {} : styles.themeBtnActive) }}
                onClick={() => darkMode && dispatch(toggleDarkMode())}
                title="Light mode"
              >
                <i className="fas fa-sun" style={{ fontSize: '12px' }} />
              </button>
              <button
                style={{ ...styles.themeBtn, ...(!darkMode ? {} : styles.themeBtnActive) }}
                onClick={() => !darkMode && dispatch(toggleDarkMode())}
                title="Dark mode"
              >
                <i className="fas fa-moon" style={{ fontSize: '12px' }} />
              </button>
            </div>
          </div>

          <div style={styles.row}>
            <div>
              <div style={styles.optionLabel}>Sidebar</div>
              <div style={styles.optionDesc}>Collapse the navigation sidebar</div>
            </div>
            <button
              style={{
                ...styles.toggle,
                ...(menuSidebarCollapsed ? styles.toggleOn : {}),
              }}
              onClick={() => dispatch(toggleSidebarMenu())}
            >
              <span style={{
                ...styles.toggleKnob,
                transform: menuSidebarCollapsed ? 'translateX(20px)' : 'translateX(2px)',
              }} />
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Dashboard</div>
          <div style={styles.row}>
            <div>
              <div style={styles.optionLabel}>Refresh Rate</div>
              <div style={styles.optionDesc}>How often live data updates</div>
            </div>
          </div>
          <div style={styles.segmentRow}>
            {REFRESH_OPTIONS.map(val => (
              <button
                key={val}
                style={{
                  ...styles.segment,
                  ...(refreshInterval === val ? styles.segmentActive : {}),
                }}
                onClick={() => dispatch(setDashboardRefresh(val))}
              >
                {refreshLabels[val]}
              </button>
            ))}
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Connection</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <div style={styles.optionLabel}>API Endpoint</div>
              <input
                type="text"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="http://localhost:8080"
                style={styles.textInput}
              />
            </div>
            <div>
              <div style={styles.optionLabel}>API Key <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></div>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Leave blank if not required"
                style={styles.textInput}
              />
            </div>
            <div>
              <div style={styles.optionLabel}>
                Prometheus URI
                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> (optional)</span>
              </div>
              <input
                type="text"
                value={metricsUrl}
                onChange={e => setMetricsUrl(e.target.value)}
                placeholder="http://prometheus:9090"
                style={styles.textInput}
              />
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>
                Enables Diameter metrics on the dashboard
              </div>
            </div>
            <div style={{ ...styles.row, borderBottom: 'none', paddingBottom: 0 }}>
              <div>
                <div style={styles.optionLabel}>Diameter Metrics</div>
                <div style={styles.optionDesc}>Show metrics section on dashboard</div>
              </div>
              <button
                style={{
                  ...styles.toggle,
                  ...(metricsEnabled ? styles.toggleOn : {}),
                }}
                onClick={() => dispatch(toggleMetrics())}
              >
                <span style={{
                  ...styles.toggleKnob,
                  transform: metricsEnabled ? 'translateX(20px)' : 'translateX(2px)',
                }} />
              </button>
            </div>
            <button style={styles.saveBtn} onClick={saveConnection}>
              <i className="fas fa-check" style={{ marginRight: '6px', fontSize: '11px' }} />
              Save Connection
            </button>
          </div>
        </section>

      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    background: 'var(--bg-surface)',
    borderLeft: '1px solid #1e2d45',
    boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
    zIndex: 1040,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', sans-serif",
    transition: 'right 0.2s ease',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    height: '56px',
    borderBottom: '1px solid #1e2d45',
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.15s ease',
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {},
  sectionTitle: {
    fontSize: '10px',
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '14px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid #1e2d45',
  },
  optionLabel: { fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' },
  optionDesc: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  toggle: {
    width: '44px',
    height: '24px',
    background: 'var(--border)',
    border: '1px solid #2a3f5c',
    borderRadius: '100px',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    padding: 0,
  },
  toggleOn: {
    background: 'var(--accent-dim)',
    borderColor: 'var(--accent)',
  },
  toggleKnob: {
    position: 'absolute',
    top: '2px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'var(--text-secondary)',
    transition: 'transform 0.2s ease',
    display: 'block',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #1e2d45',
  },
  infoLabel: { fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" },
  infoValue: { fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace" },
  textInput: {
    width: '100%',
    marginTop: '6px',
    padding: '8px 10px',
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: 'var(--text-primary)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s ease',
  },
  saveBtn: {
    width: '100%',
    padding: '8px',
    marginTop: '4px',
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent)',
    borderRadius: '6px',
    color: 'var(--accent)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  themeToggle: {
    display: 'flex',
    gap: '4px',
    background: 'var(--bg-base)',
    border: '1px solid #1e2d45',
    borderRadius: '8px',
    padding: '3px',
    flexShrink: 0,
  },
  themeBtn: {
    width: '30px',
    height: '26px',
    background: 'transparent',
    border: 'none',
    borderRadius: '5px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  themeBtnActive: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
  },
  segmentRow: {
    display: 'flex',
    gap: '6px',
    paddingBottom: '12px',
    borderBottom: '1px solid #1e2d45',
  },
  segment: {
    flex: 1,
    padding: '7px 0',
    background: 'var(--bg-base)',
    border: '1px solid #1e2d45',
    borderRadius: '6px',
    color: 'var(--text-muted)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  segmentActive: {
    background: 'var(--accent-dim)',
    borderColor: 'var(--accent)',
    color: 'var(--accent)',
  },
};

export default ControlSidebar;
