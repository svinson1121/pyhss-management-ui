import React from 'react';
import packageJSON from '../../../../package.json';

interface FooterProps {
  sidebarWidth?: number;
  controlSidebarCollapsed?: boolean;
  controlSidebarWidth?: number;
}

const Footer = ({ sidebarWidth = 240, controlSidebarCollapsed = true, controlSidebarWidth = 280 }: FooterProps) => (
  <footer style={{
    ...styles.footer,
    left: sidebarWidth,
    right: controlSidebarCollapsed ? 0 : controlSidebarWidth,
    transition: 'left 0.2s ease, right 0.2s ease',
  }}>
    <span>PyHSS Management UI</span>
    <span style={styles.sep}>·</span>
    <span>v{packageJSON.version}</span>
  </footer>
);

const styles: Record<string, React.CSSProperties> = {
  footer: {
    position: 'fixed', bottom: 0, height: '40px',
    background: 'var(--bg-surface)',
    borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '0 24px', fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-muted)', zIndex: 1020,
  },
  sep: { color: 'var(--border)' },
  right: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' },
  dot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px rgba(0,230,118,0.5)' },
};

export default Footer;
