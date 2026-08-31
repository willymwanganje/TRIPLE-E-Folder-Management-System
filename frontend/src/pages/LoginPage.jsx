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
      <section className="login-brand-panel">
        <div className="brand-content">
          <div className="login-logo-box">
            <img
              src={logo}
              alt="Triple-E Logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement.innerHTML = '<span style="font-size:34px;font-weight:900">✓</span>';
              }}
            />
          </div>

          <div className="brand-title">TRIPLE-E</div>
          <p className="brand-description">
            Securely organize, manage and govern Rice Council of Tanzania
            documents, folders and access.
          </p>

          <div className="brand-features">
            <div>✓ Role-based access control</div>
            <div>✓ Centralized document management</div>
            <div>✓ Audit-ready activity tracking</div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <form className="login-card" onSubmit={submit}>
          <h1>Welcome back</h1>
          <p className="login-subtitle">Sign in to your workspace.</p>

          <label htmlFor="login-email">
            Email
            <input
              id="login-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="name@organization.org"
              autoComplete="email"
              required
            />
          </label>

          <label className="password-label" htmlFor="login-password">
            Password
            <div className="password-input-wrap">
              <input
                id="login-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '◉' : '◌'}
              </button>
            </div>
          </label>

          <button className="login-button" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="demo-box">
            <strong>Local Super Admin</strong>
            <br />
            admin@triple-e.local · Admin@12345
          </div>
        </form>
      </section>

      <style>{`
        .login-page {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr);
          min-height: 100vh;
          width: 100%;
          overflow-x: hidden;
          background: #f3f7f8;
        }

        .login-brand-panel {
          display: flex;
          align-items: center;
          min-width: 0;
          padding: clamp(32px, 7vw, 100px);
          color: #fff;
          background: linear-gradient(145deg, #062e2d, #0f766e);
        }

        .brand-content {
          width: 100%;
          max-width: 540px;
          margin: 0 auto;
        }

        .login-logo-box {
          display: grid;
          place-items: center;
          width: 110px;
          height: 110px;
          margin-bottom: 24px;
          border: 1px solid rgba(255,255,255,.35);
          border-radius: 18px;
          background: rgba(255,255,255,.14);
          overflow: hidden;
        }

        .login-logo-box img {
          width: 100%;
          height: 100%;
          padding: 8px;
          object-fit: contain;
          background: #fff;
        }

        .brand-title {
          font-size: clamp(36px, 5vw, 62px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: .02em;
        }

        .brand-description {
          max-width: 520px;
          margin: 16px 0 0;
          color: rgba(255,255,255,.88);
          font-size: 17px;
          line-height: 1.55;
        }

        .brand-features {
          display: grid;
          gap: 11px;
          margin-top: 30px;
          color: rgba(255,255,255,.92);
          font-size: 13px;
        }

        .login-form-panel {
          display: grid;
          place-items: center;
          min-width: 0;
          padding: 32px 24px;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 34px;
          border: 1px solid #e8edf3;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 8px 30px rgba(15,23,42,.08);
        }

        .login-card h1 {
          margin: 0 0 7px;
          color: #0f172a;
          font-size: 32px;
          line-height: 1.15;
        }

        .login-subtitle {
          margin: 0 0 25px;
          color: #64748b;
        }

        .login-card label {
          display: grid;
          gap: 7px;
          color: #0f172a;
          font-size: 13px;
          font-weight: 700;
        }

        .password-label {
          margin-top: 15px;
        }

        .login-card input {
          width: 100%;
          min-width: 0;
          padding: 12px;
          border: 1px solid #d8dee8;
          border-radius: 10px;
          outline: none;
          font-size: 15px;
        }

        .password-input-wrap {
          position: relative;
          width: 100%;
        }

        .password-input-wrap input {
          padding-right: 46px;
        }

        .login-card input:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(15,118,110,.12);
        }

        .password-toggle {
          position: absolute;
          top: 50%;
          right: 10px;
          display: grid;
          width: 30px;
          height: 30px;
          padding: 0;
          place-items: center;
          transform: translateY(-50%);
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #64748b;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
        }

        .password-toggle:hover {
          background: #f1f5f9;
          color: #0f766e;
        }

        .login-button {
          width: 100%;
          margin-top: 20px;
          padding: 12px 14px;
          border: 0;
          border-radius: 10px;
          background: #0f766e;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
        }

        .login-button:disabled {
          cursor: wait;
          opacity: .7;
        }

        .demo-box {
          margin-top: 18px;
          padding: 14px 16px;
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          color: #334155;
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        @media (max-width: 760px) {
          .login-page {
            display: block;
            min-height: 100svh;
          }

          .login-brand-panel {
            display: block;
            padding: 28px 20px 26px;
          }

          .brand-content {
            max-width: 100%;
          }

          .login-logo-box {
            width: 86px;
            height: 86px;
            margin-bottom: 18px;
            border-radius: 14px;
          }

          .login-logo-box img {
            padding: 6px;
          }

          .brand-title {
            font-size: 34px;
          }

          .brand-description {
            margin-top: 10px;
            font-size: 14px;
            line-height: 1.45;
          }

          .brand-features {
            gap: 7px;
            margin-top: 17px;
            font-size: 12px;
          }

          .login-form-panel {
            display: block;
            padding: 22px 16px 32px;
          }

          .login-card {
            max-width: 100%;
            padding: 24px 20px;
            border-radius: 14px;
          }

          .login-card h1 {
            font-size: 28px;
          }
        }

        @media (max-width: 360px) {
          .login-brand-panel { padding-inline: 16px; }
          .login-form-panel { padding-inline: 10px; }
          .login-card { padding-inline: 16px; }
          .brand-title { font-size: 30px; }
        }
      `}</style>
    </main>
  );
}
