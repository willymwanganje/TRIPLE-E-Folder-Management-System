import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: '⊞', perm: null },
  { to: '/documents', label: 'All Documents', icon: '📄', perm: 'document.view' },
  { to: '/upload', label: 'Upload Document', icon: '☁', perm: 'document.create' },
  { to: '/folders', label: 'Folders', icon: '🗂', perm: 'folder.view' },
  { to: '/categories', label: 'Categories', icon: '🏷', perm: 'category.manage' },
  { to: '/users', label: 'Users', icon: '👥', perm: 'user.view' },
  { to: '/admin/roles', label: 'Administrators', icon: '🛡', perm: 'role.manage' },
  { to: '/admin/roles', label: 'Roles & Permissions', icon: '🔑', perm: 'role.manage' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: '🕐', perm: 'audit.view' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙', perm: 'settings.manage' },
  { to: '/profile', label: 'Profile', icon: '👤', perm: 'profile.update' },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();

  const allowed = (permission) => (
    user?.isSuperAdmin ||
    !permission ||
    user?.permissions?.includes(permission)
  );

  const workspaceLinks = NAV_LINKS.filter((link) => (
    ['/', '/documents', '/upload', '/folders', '/users', '/profile'].includes(link.to) &&
    allowed(link.perm)
  ));

  const adminLinks = NAV_LINKS.filter((link) => (
    ['/categories', '/admin/roles', '/admin/audit-logs', '/admin/settings'].includes(link.to) &&
    allowed(link.perm)
  ));

  const seen = new Set();
  const uniqueAdminLinks = adminLinks.filter((link) => {
    const key = `${link.to}-${link.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    padding: '10px 12px',
    borderRadius: 8,
    color: isActive ? '#fff' : '#b5c2d1',
    background: isActive ? '#0f766e' : 'transparent',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 14,
    transition: 'background 0.15s ease',
  });

  return (
    <aside
      style={{
        width: 250,
        minWidth: 250,
        height: '100vh',
        minHeight: '100vh',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '20px 14px',
        background: '#0b1728',
        color: '#fff',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 0,
          marginBottom: 32,
          padding: '0 6px',
        }}
      >
        <img
          src="/logo.png"
          alt="Triple-E Logo"
          style={{
            width: 48,
            height: 48,
            flex: '0 0 auto',
            borderRadius: 10,
            objectFit: 'contain',
            background: '#fff',
            padding: 4,
          }}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '.03em' }}>
            TRIPLE-E
          </div>
          <div
            style={{
              color: '#9fb0c4',
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '.06em',
              whiteSpace: 'nowrap',
            }}
          >
            FOLDER MANAGEMENT
          </div>
        </div>
      </div>

      {/* Workspace links */}
      <div
        style={{
          margin: '0 0 8px 6px',
          color: '#72839a',
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        Workspace
      </div>

      <nav style={{ display: 'grid', gap: 2, marginBottom: 24 }}>
        {workspaceLinks.map(({ to, label, icon }) => (
          <NavLink key={`${to}-${label}`} to={to} end={to === '/'} style={linkStyle}>
            <span style={{ width: 20, flex: '0 0 20px', fontSize: 16, textAlign: 'center' }}>
              {icon}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Administration links */}
      {uniqueAdminLinks.length > 0 && (
        <>
          <div
            style={{
              margin: '0 0 8px 6px',
              color: '#72839a',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
            }}
          >
            Administration
          </div>

          <nav style={{ display: 'grid', gap: 2, marginBottom: 24 }}>
            {uniqueAdminLinks.map(({ to, label, icon }) => (
              <NavLink key={`${to}-${label}`} to={to} style={linkStyle}>
                <span style={{ width: 20, flex: '0 0 20px', fontSize: 16, textAlign: 'center' }}>
                  {icon}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              </NavLink>
            ))}
          </nav>
        </>
      )}

      {/* Super Admin badge */}
      {user?.isSuperAdmin && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 14px',
            border: '1px solid #24344a',
            borderRadius: 10,
            background: '#101f32',
          }}
        >
          <div style={{ color: '#dbe6f2', fontWeight: 900, fontSize: 13 }}>
            Super Admin
          </div>
          <div style={{ marginTop: 3, color: '#91a3b8', fontSize: 12 }}>
            All system controls enabled
          </div>
        </div>
      )}

      {/* User profile and logout */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          borderTop: '1px solid #1e2f45',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 0,
            marginBottom: 12,
          }}
        >
          <Avatar
            name={user?.fullName || 'User'}
            src={user?.profilePhotoUrl}
            size={38}
          />

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                overflow: 'hidden',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.fullName || 'User'}
            </div>
            <div style={{ marginTop: 3, color: '#94a3b8', fontSize: 11 }}>
              {user?.isSuperAdmin ? 'Super Admin' : user?.role?.name || 'User'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #344b68',
            borderRadius: 8,
            background: '#1a2d44',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
