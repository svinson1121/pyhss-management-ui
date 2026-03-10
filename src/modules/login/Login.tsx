import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import { setAuthentication } from '@store/reducers/auth';
import { setWindowClass } from '@app/utils/helpers';
import * as Yup from 'yup';
import { authLogin } from '@app/utils/oidc-providers';

const Login = () => {
  const [isAuthLoading, setAuthLoading] = React.useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [t] = useTranslation();

  const login = async (password: string, api: string) => {
    try {
      setAuthLoading(true);
      const response = await authLogin(password, api);
      dispatch(setAuthentication(response as any));
      toast.success('Authentication successful');
      setAuthLoading(false);
      window.location.reload();
    } catch (error: any) {
      setAuthLoading(false);
      toast.error(error.message || 'Authentication failed');
    }
  };

  const { handleChange, values, handleSubmit, touched, errors } = useFormik({
    initialValues: {
      api: 'http://localhost:8080',
      password: '',
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(5, 'Must be 5 characters or more')
        .max(30, 'Must be 30 characters or less'),
    }),
    onSubmit: (values) => {
      login(values.password, values.api);
    },
  });

  setWindowClass('hold-transition login-page');

  return (
    <div style={styles.page}>
      <div style={styles.grid} />
      <div style={styles.glow} />

      <div style={styles.container}>
        <div style={styles.brand}>
          <div style={styles.logoMark}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="8" fill="rgba(0,200,255,0.1)" stroke="rgba(0,200,255,0.25)" strokeWidth="1"/>
              <rect x="8" y="13" width="5" height="10" fill="#00c8ff" fillOpacity="0.7"/>
              <rect x="15" y="9" width="5" height="18" fill="#00c8ff"/>
              <rect x="22" y="11" width="5" height="14" fill="#00c8ff" fillOpacity="0.5"/>
            </svg>
          </div>
          <div>
            <div style={styles.logoText}>
              <span style={styles.logoPY}>PY</span>
              <span style={styles.logoHSS}>HSS</span>
            </div>
            <div style={styles.logoSub}>Home Subscriber Server</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>Sign in to continue</span>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>API Endpoint</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <i className="fas fa-sitemap" style={{ fontSize: 12 }} />
                </span>
                <input
                  id="api"
                  name="api"
                  type="text"
                  placeholder="http://localhost:8080"
                  onChange={handleChange}
                  value={values.api}
                  style={{
                    ...styles.input,
                    ...(touched.api && errors.api ? styles.inputError : {}),
                  }}
                />
              </div>
              {touched.api && errors.api && (
                <span style={styles.errorText}>{errors.api}</span>
              )}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>API Key</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <i className="fas fa-key" style={{ fontSize: 12 }} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your API key"
                  onChange={handleChange}
                  value={values.password}
                  style={{
                    ...styles.input,
                    ...(touched.password && errors.password ? styles.inputError : {}),
                  }}
                />
              </div>
              {touched.password && errors.password && (
                <span style={styles.errorText}>{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isAuthLoading}
              style={{
                ...styles.submitBtn,
                ...(isAuthLoading ? styles.submitBtnLoading : {}),
              }}
            >
              {isAuthLoading ? 'Authenticating…' : (
                <>
                  <i className="fas fa-sign-in-alt" />
                  &nbsp; Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <div style={styles.footer}>
          PyHSS Management Interface &nbsp;·&nbsp; v0.1.4
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: [
      'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(30,45,70,0.35) 59px, rgba(30,45,70,0.35) 60px)',
      'repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(30,45,70,0.35) 59px, rgba(30,45,70,0.35) 60px)',
    ].join(','),
    pointerEvents: 'none',
  },
  glow: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '700px',
    height: '400px',
    background: 'radial-gradient(ellipse, rgba(0,200,255,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
    padding: '0 20px',
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '28px',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '14px' },
  logoMark: { flexShrink: 0 },
  logoText: { fontFamily: "'Syne', sans-serif", fontSize: '30px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 },
  logoPY: { color: 'var(--accent)' },
  logoHSS: { color: 'var(--text-primary)' },
  logoSub: { fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '4px' },
  card: { width: '100%', background: 'var(--bg-card)', border: '1px solid #2a3f5c', borderRadius: '12px', boxShadow: '0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,200,255,0.04)', overflow: 'hidden' },
  cardHeader: { padding: '14px 24px', borderBottom: '1px solid #1e2d45', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)' },
  cardTitle: { fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.02em' },
  form: { padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '7px' },
  label: { fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.12em' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', color: 'var(--text-muted)', zIndex: 1, display: 'flex', alignItems: 'center' },
  input: { width: '100%', background: 'var(--bg-elevated)', border: '1px solid #1e2d45', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif", fontSize: '14px', padding: '10px 14px 10px 36px', outline: 'none' },
  inputError: { borderColor: 'var(--accent-red)' },
  errorText: { fontSize: '11px', color: 'var(--accent-red)', fontFamily: "'IBM Plex Mono', monospace" },
  submitBtn: { width: '100%', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: 'var(--bg-base)', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '4px', letterSpacing: '0.01em', transition: 'all 0.18s ease' },
  submitBtnLoading: { background: '#0087aa', cursor: 'not-allowed', opacity: 0.7 },
  footer: { fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.05em' },
};

export default Login;
