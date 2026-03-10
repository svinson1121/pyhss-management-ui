import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import i18n from '@app/utils/i18n';

export interface IMenuItem {
  name: string;
  icon?: string;
  path?: string;
  children?: Array<IMenuItem>;
}

export const MENU: IMenuItem[] = [
  { name: i18n.t('menusidebar.label.dashboard'), icon: 'fas fa-tachometer-alt', path: '/' },
  { name: i18n.t('menusidebar.label.apn'), icon: 'fas fa-wifi', path: '/apn' },
  { name: i18n.t('menusidebar.label.auc'), icon: 'fas fa-sim-card', path: '/auc' },
  { name: i18n.t('menusidebar.label.subscriber'), icon: 'fas fa-users', path: '/subscriber' },
  { name: i18n.t('menusidebar.label.imssubscriber'), icon: 'fas fa-user-tie', path: '/imssubscriber' },
  { name: i18n.t('menusidebar.label.tft'), icon: 'fas fa-shield-alt', path: '/tft' },
  { name: i18n.t('menusidebar.label.chargingrule'), icon: 'fas fa-search-dollar', path: '/chargingrule' },
  { name: i18n.t('menusidebar.label.eir'), icon: 'fas fa-database', path: '/eir' },
  {
    name: 'Roaming',
    icon: 'fas fa-globe',
    children: [
      { name: i18n.t('menusidebar.label.roamingnetwork'), icon: 'fas fa-network-wired', path: '/roamingnetwork' },
      { name: i18n.t('menusidebar.label.roamingrule'), icon: 'fas fa-book', path: '/roamingrule' },
    ],
  },
  { name: 'OAM', icon: 'fas fa-server', path: '/oam' },
  { name: 'Subscriber Wizard', icon: 'fas fa-magic', path: '/addwizard' },
];

const NavItem = ({ item, collapsed }: { item: IMenuItem; collapsed: boolean }) => {
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const [flyoutOpen, setFlyoutOpen] = React.useState(false);
  const [flyoutTop, setFlyoutTop] = React.useState(0);
  const itemRef = React.useRef<HTMLLIElement>(null);
  const flyoutRef = React.useRef<HTMLDivElement>(null);
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = item.children?.some(c => c.path && location.pathname === c.path);

  React.useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  React.useEffect(() => {
    if (!flyoutOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        itemRef.current && !itemRef.current.contains(e.target as Node) &&
        flyoutRef.current && !flyoutRef.current.contains(e.target as Node)
      ) setFlyoutOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [flyoutOpen]);

  if (hasChildren) {
    if (collapsed) {
      return (
        <li ref={itemRef} style={nav.item}>
          <button
            onClick={() => {
              if (itemRef.current) {
                const rect = itemRef.current.getBoundingClientRect();
                setFlyoutTop(rect.top);
              }
              setFlyoutOpen(o => !o);
            }}
            style={{
              ...nav.link,
              ...(isChildActive ? nav.linkActive : {}),
              justifyContent: 'center',
              background: flyoutOpen ? 'var(--accent-dim)' : (isChildActive ? 'var(--accent-dim)' : 'transparent'),
              color: flyoutOpen ? 'var(--accent)' : (isChildActive ? 'var(--accent)' : 'var(--text-secondary)'),
            }}
          >
            <i className={item.icon} style={nav.icon} />
          </button>
          {flyoutOpen && (
            <div
              ref={flyoutRef}
              style={{
                position: 'fixed',
                left: 64,
                top: flyoutTop,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-bright)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-elevated)',
                zIndex: 2000,
                minWidth: '180px',
                padding: '6px',
              }}
            >
              <div style={{
                fontSize: '10px',
                fontFamily: "var(--font-mono)",
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '6px 10px 8px',
                borderBottom: '1px solid var(--border)',
                marginBottom: '4px',
              }}>
                {item.name}
              </div>
              {item.children!.map(child => (
                <NavLink
                  key={child.path}
                  to={child.path!}
                  onClick={() => setFlyoutOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: "var(--font-ui)",
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  })}
                >
                  <i className={child.icon} style={{ width: '14px', textAlign: 'center', fontSize: '12px', flexShrink: 0 }} />
                  <span>{child.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </li>
      );
    }

    return (
      <li style={nav.item}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ ...nav.link, ...(isChildActive ? nav.linkActive : {}), justifyContent: 'flex-start' }}
        >
          <i className={item.icon} style={nav.icon} />
          <span style={nav.label}>{item.name}</span>
          <i className={`fas fa-chevron-${open ? 'down' : 'right'}`} style={nav.chevron} />
        </button>
        {open && (
          <ul style={nav.subList}>
            {item.children!.map(child => (
              <NavItem key={child.path} item={child} collapsed={false} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li style={nav.item}>
      <NavLink
        to={item.path!}
        title={collapsed ? item.name : undefined}
        style={({ isActive }) => ({
          ...nav.link,
          ...(isActive ? nav.linkActive : {}),
          justifyContent: collapsed ? 'center' : 'flex-start',
          textDecoration: 'none',
        })}
      >
        <i className={item.icon} style={nav.icon} />
        {!collapsed && <span style={nav.label}>{item.name}</span>}
      </NavLink>
    </li>
  );
};

const MenuSidebar = ({ collapsed = false }: { collapsed?: boolean }) => {
  const width = collapsed ? 56 : 240;
  return (
    <aside style={{ ...styles.sidebar, width }}>
      <NavLink to="/" style={{ ...styles.brand, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={styles.brandIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="9" width="4" height="7" fill="var(--accent)" fillOpacity="0.6"/>
            <rect x="10" y="5" width="4" height="14" fill="var(--accent)"/>
            <rect x="18" y="7" width="4" height="10" fill="var(--accent)" fillOpacity="0.4"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div style={styles.brandName}>
              <span style={styles.brandPY}>PY</span>
              <span style={styles.brandHSS}>HSS</span>
            </div>
            <div style={styles.brandSub}>Management UI</div>
          </div>
        )}
      </NavLink>
      <nav style={styles.nav}>
        {!collapsed && <div style={styles.sectionLabel}>Navigation</div>}
        <ul style={styles.navList}>
          {MENU.map(item => (
            <NavItem key={item.name + item.path} item={item} collapsed={collapsed} />
          ))}
        </ul>
      </nav>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    display: 'flex', flexDirection: 'column',
    zIndex: 1035, fontFamily: 'var(--font-ui)',
    transition: 'width 0.2s ease', overflow: 'hidden',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '16px 14px', borderBottom: '1px solid var(--border)',
    textDecoration: 'none', flexShrink: 0, transition: 'all 0.2s ease',
  },
  brandIcon: { flexShrink: 0 },
  brandName: { fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 },
  brandPY: { color: 'var(--accent)' },
  brandHSS: { color: 'var(--text-primary)' },
  brandSub: { fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' },
  nav: { flex: 1, padding: '12px 0', overflowY: 'auto', overflowX: 'hidden' },
  sectionLabel: { fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 16px 6px', whiteSpace: 'nowrap' },
  navList: { listStyle: 'none', margin: 0, padding: '0 8px' },
};

const nav: Record<string, React.CSSProperties> = {
  item: { marginBottom: '2px' },
  link: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '8px 10px', borderRadius: '6px',
    border: '1px solid transparent',
    color: 'var(--text-secondary)',
    fontSize: '13px', fontWeight: 500, cursor: 'pointer',
    background: 'transparent', width: '100%', textAlign: 'left',
    transition: 'all 0.15s ease', textDecoration: 'none',
    fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap',
  },
  linkActive: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(0,200,255,0.2)',
  },
  icon: { width: '16px', textAlign: 'center', fontSize: '13px', flexShrink: 0 },
  label: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' },
  chevron: { fontSize: '10px', color: 'var(--text-muted)' },
  subList: { listStyle: 'none', margin: '2px 0 0', padding: '0 0 0 26px' },
};

export default MenuSidebar;
