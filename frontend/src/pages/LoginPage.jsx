import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import logo from '../assets/logo.png';

export default function LoginPage() {
  const { user, login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (error) {
      push(error?.message || 'Unable to sign in. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">

      {/* Left brand panel */}
      <section className="login-brand-panel">
        <div className="brand-content">

          <div className="login-logo-box">
            <img src={logo} alt="Triple-E Logo"
              onError={e => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement.innerHTML = '<span style="font-size:28px;font-weight:900;color:#0f766e">✓</span>';
              }}
            />
          </div>

          <div className="brand-title">Triple-E File Management System</div>
          <p className="brand-description">
            Securely organize, manage and govern Rice Council of Tanzania
            documents, folders and access.
          </p>

          <div className="brand-features">
            <div className="brand-feature">
              <span className="feature-icon">🔐</span>
              <span>Role-based access control</span>
            </div>
            <div className="brand-feature">
              <span className="feature-icon">📁</span>
              <span>Centralized document management</span>
            </div>
            <div className="brand-feature">
              <span className="feature-icon">📋</span>
              <span>Audit-ready activity tracking</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right form panel */}
      <section className="login-form-panel">
        <form className="login-card" onSubmit={submit}>

          <div className="login-card-header">
            <h1>Welcome back</h1>
            <p className="login-subtitle">Sign in to your workspace.</p>
          </div>

          <div className="login-fields">
            <label htmlFor="login-email">
              Email
              <input
                id="login-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                type="email"
                placeholder="name@organization.org"
                autoComplete="email"
                required
              />
            </label>

            <label htmlFor="login-password">
              Password
              <div className="password-input-wrap">
                <input
                  id="login-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '◉' : '◌'}
                </button>
              </div>
            </label>
          </div>

          <button className="login-button" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="demo-box">
            <strong>Local Super Admin</strong>
            <br />
            admin@triple-e.local · Admin@12345
          </div>

        </form>

        <div className="login-footer">
          © {new Date().getFullYear()} Triple-E · Rice Council of Tanzania
        </div>
      </section>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        .login-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          width: 100%;
          background: #f0f4f8;
        }

        /* ── Brand panel ── */
        .login-brand-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(40px, 6vw, 80px);
          background: linear-gradient(155deg, #052e2c 0%, #0d5c56 50%, #0f766e 100%);
          color: #fff;
          position: relative;
          overflow: hidden;
        }

        .login-brand-panel::before {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: rgba(255,255,255,.04);
        }

        .login-brand-panel::after {
          content: '';
          position: absolute;
          bottom: -60px; left: -60px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: rgba(255,255,255,.04);
        }

        .brand-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 460px;
        }

        .login-logo-box {
          width: 240px;
          height: 110px;
          margin-bottom: 28px;
          background: #fff;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,.15);
        }

        .login-logo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          padding: 0;
        }

        .brand-title {
          font-size: clamp(20px, 2.8vw, 28px);
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: .01em;
          margin-bottom: 14px;
        }

        .brand-description {
          font-size: 15px;
          line-height: 1.6;
          color: rgba(255,255,255,.82);
          margin: 0 0 32px;
          max-width: 380px;
        }

        .brand-features {
          display: grid;
          gap: 14px;
        }

        .brand-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: rgba(255,255,255,.9);
        }

        .feature-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        /* ── Form panel ── */
        .login-form-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(32px, 5vw, 60px) clamp(20px, 5vw, 60px);
          gap: 24px;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 20px;
          padding: clamp(28px, 5vw, 40px);
          box-shadow: 0 4px 32px rgba(15,23,42,.10);
          border: 1px solid #e2e8f0;
        }

        .login-card-header {
          margin-bottom: 28px;
        }

        .login-card h1 {
          margin: 0 0 6px;
          font-size: clamp(24px, 4vw, 30px);
          font-weight: 800;
          color: #0f172a;
          line-height: 1.2;
        }

        .login-subtitle {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .login-fields {
          display: grid;
          gap: 18px;
          margin-bottom: 24px;
        }

        .login-card label {
          display: grid;
          gap: 7px;
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }

        .login-card input {
          width: 100%;
          padding: 13px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 15px;
          outline: none;
          color: #0f172a;
          background: #f8fafc;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .login-card input:focus {
          border-color: #0f766e;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(15,118,110,.12);
        }

        .password-input-wrap {
          position: relative;
        }

        .password-input-wrap input {
          padding-right: 46px;
        }

        .password-toggle {
          position: absolute;
          top: 50%; right: 10px;
          transform: translateY(-50%);
          width: 32px; height: 32px;
          border: none; background: transparent;
          color: #64748b; font-size: 20px;
          cursor: pointer; border-radius: 6px;
          display: grid; place-items: center;
        }

        .password-toggle:hover {
          background: #f1f5f9;
          color: #0f766e;
        }

        .login-button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #0f766e, #0d5c56);
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: .02em;
          box-shadow: 0 4px 14px rgba(15,118,110,.35);
          transition: opacity 0.2s, transform 0.1s;
        }

        .login-button:hover:not(:disabled) {
          opacity: .93;
          transform: translateY(-1px);
        }

        .login-button:disabled {
          opacity: .65;
          cursor: wait;
        }

        .demo-box {
          margin-top: 18px;
          padding: 14px 16px;
          border: 1.5px dashed #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          color: #475569;
          font-size: 12px;
          line-height: 1.6;
        }

        .login-footer {
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
        }

        /* ── Mobile ── */
        @media (max-width: 700px) {
          .login-page {
            grid-template-columns: 1fr;
            grid-template-rows: auto 1fr;
          }

          .login-brand-panel {
            padding: 28px 20px 24px;
            justify-content: flex-start;
          }

          .login-logo-box {
            width: 180px;
            height: 80px;
            margin-bottom: 16px;
            border-radius: 10px;
          }

          .brand-title { font-size: 18px; margin-bottom: 10px; }
          .brand-description { font-size: 13px; margin-bottom: 20px; }
          .brand-features { gap: 10px; }
          .brand-feature { font-size: 13px; }

          .login-form-panel {
            padding: 24px 16px 32px;
            justify-content: flex-start;
          }

          .login-card {
            border-radius: 16px;
            padding: 24px 20px;
          }
        }

        @media (max-width: 360px) {
          .login-brand-panel { padding: 20px 14px; }
          .login-form-panel { padding: 20px 12px 28px; }
          .login-card { padding: 20px 16px; }
          .login-logo-box { width: 150px; height: 68px; }
        }
      `}</style>
    </main>
  );
}