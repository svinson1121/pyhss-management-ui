import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleControlSidebar, toggleSidebarMenu } from '@app/store/reducers/ui';
import UserDropdown from '@app/modules/main/header/user-dropdown/UserDropdown';

interface HeaderProps { sidebarWidth?: number; }

const Header = ({ sidebarWidth = 240 }: HeaderProps) => {
  const dispatch = useDispatch();
  const controlSidebarCollapsed = useSelector((state: any) => state.ui.controlSidebarCollapsed);
  const menuSidebarCollapsed = useSelector((state: any) => state.ui.menuSidebarCollapsed);

  return (
    <nav style={{ ...styles.header, left: sidebarWidth, transition: 'left 0.2s ease' }}>
      <div style={styles.left}>
        <button
          style={{ ...styles.iconBtn, ...(menuSidebarCollapsed ? styles.iconBtnActive : {}) }}
          onClick={() => dispatch(toggleSidebarMenu())}
          title={menuSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className={menuSidebarCollapsed ? 'fas fa-indent' : 'fas fa-outdent'} />
        </button>
      </div>
      <div style={styles.right}>
        <UserDropdown />
        <button
          style={{ ...styles.iconBtn, ...(!controlSidebarCollapsed ? styles.iconBtnActive : {}) }}
          onClick={() => dispatch(toggleControlSidebar())}
          title="Toggle settings panel"
        >
          <i className="fas fa-sliders-h" />
        </button>
      </div>
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    position: 'fixed', top: 0, right: 0, height: '56px',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 16px', zIndex: 1030, fontFamily: 'var(--font-ui)',
  },
  left: { display: 'flex', alignItems: 'center', gap: '10px' },
  right: { display: 'flex', alignItems: 'center', gap: '4px' },
  iconBtn: {
    background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
    color: 'var(--text-secondary)', width: '34px', height: '34px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.15s ease', fontSize: '14px',
  },
  iconBtnActive: {
    background: 'var(--accent-dim)',
    borderColor: 'var(--accent-dim)',
    color: 'var(--accent)',
  },
};

export default Header;
