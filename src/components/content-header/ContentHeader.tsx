import React from 'react';

interface ContentHeaderProps {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
}

const ContentHeader = ({ title, onAdd, addLabel = 'Add Record' }: ContentHeaderProps) => {
  return (
    <div style={styles.header}>
      <h1 style={styles.title}>{title}</h1>
      {onAdd && (
        <button
          style={styles.addBtn}
          onClick={onAdd}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,200,255,0.08)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {addLabel}
        </button>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #1e2d45',
    fontFamily: "'Inter', sans-serif",
    gap: '16px',
  },
  title: {
    fontFamily: "'Syne', sans-serif",
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  addBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: '1px solid #2a3f5c',
    borderRadius: '7px',
    color: 'var(--text-primary)',
    fontFamily: "'Inter', sans-serif",
    fontSize: '13px',
    fontWeight: 600,
    padding: '8px 16px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
  },
};

export default ContentHeader;
