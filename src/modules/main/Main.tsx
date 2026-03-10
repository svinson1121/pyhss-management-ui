import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '@app/modules/main/header/Header';
import MenuSidebar from '@app/modules/main/menu-sidebar/MenuSidebar';
import Footer from '@app/modules/main/footer/Footer';
import ControlSidebar from '@app/modules/main/control-sidebar/ControlSidebar';

const SIDEBAR_FULL = 240;
const SIDEBAR_COLLAPSED = 56;
const CONTROL_SIDEBAR_WIDTH = 280;

const Main = () => {
  const authentication = useSelector((state: any) => state.auth.authentication);
  const menuSidebarCollapsed = useSelector((state: any) => state.ui.menuSidebarCollapsed);
  const controlSidebarCollapsed = useSelector((state: any) => state.ui.controlSidebarCollapsed);
  const [isAppLoaded, setIsAppLoaded] = useState(false);

  useEffect(() => {
    setIsAppLoaded(Boolean(authentication));
  }, [authentication]);

  if (!isAppLoaded) {
    return (
      <div style={styles.preloader}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ animation: 'pyhssPulse 1.2s ease-in-out infinite' }}>
          <rect x="4" y="15" width="6" height="10" fill="#00c8ff" fillOpacity="0.5"/>
          <rect x="17" y="8" width="6" height="24" fill="#00c8ff"/>
          <rect x="30" y="12" width="6" height="16" fill="#00c8ff" fillOpacity="0.3"/>
        </svg>
        <span style={styles.preloaderText}>Initializing…</span>
        <style>{`@keyframes pyhssPulse { 0%,100%{opacity:0.4;transform:scale(0.95)} 50%{opacity:1;transform:scale(1)} }`}</style>
      </div>
    );
  }

  const sidebarWidth = menuSidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;

  return (
    <div style={styles.wrapper}>
      <MenuSidebar collapsed={menuSidebarCollapsed} />

      <Header sidebarWidth={sidebarWidth} />

      {/* Main content shifts right with sidebar, and left when control sidebar opens */}
      <main style={{
        ...styles.content,
        marginLeft: sidebarWidth,
        marginRight: controlSidebarCollapsed ? 0 : CONTROL_SIDEBAR_WIDTH,
        transition: 'margin 0.2s ease',
      }}>
        <Outlet />
      </main>

      <Footer sidebarWidth={sidebarWidth} controlSidebarCollapsed={controlSidebarCollapsed} controlSidebarWidth={CONTROL_SIDEBAR_WIDTH} />

      <ControlSidebar collapsed={controlSidebarCollapsed} width={CONTROL_SIDEBAR_WIDTH} />

      {/* Overlay when control sidebar is open */}
      {!controlSidebarCollapsed && (
        <div style={styles.overlay} />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: 'var(--bg-base)',
    minHeight: '100vh',
    fontFamily: "'Inter', sans-serif",
  },
  content: {
    paddingTop: '56px',
    paddingBottom: '40px',
    paddingLeft: '24px',
    paddingRight: '24px',
    minHeight: '100vh',
    background: 'var(--bg-base)',
  },
  preloader: {
    position: 'fixed',
    inset: 0,
    background: 'var(--bg-base)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    gap: '16px',
    fontFamily: "'Inter', sans-serif",
  },
  preloaderText: {
    fontSize: '12px',
    fontFamily: "'IBM Plex Mono', monospace",
    color: '#3d5273',
    letterSpacing: '0.1em',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(5,8,15,0.5)',
    zIndex: 1039,
    backdropFilter: 'blur(2px)',
  },
};

export default Main;
