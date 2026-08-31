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

export default function Sidebar() {
  const { user, logout } = useAuth();
  const allowed = (p) => user?.isSuperAdmin || !p || user?.permissions?.includes(p);

  const workspaceLinks = NAV_LINKS.filter(l =>
    ['/', '/documents', '/upload', '/folders', '/users', '/profile'].includes(l.to) && allowed(l.perm)
  );

  const adminLinks = NAV_LINKS.filter(l =>
    ['/categories', '/admin/roles', '/admin/audit-logs', '/admin/settings'].includes(l.to) && allowed(l.perm)
  );

  // Deduplicate admin links
  const seen = new Set();
  const uniqueAdminLinks = adminLinks.filter(l => {
    const key = l.to + l.label;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <aside style={{
      width: 250, minHeight: '100vh', flexShrink: 0,
      background: '#0b1728', color: '#fff',
      padding: '20px 14px', display: 'flex',
      flexDirection: 'column', position: 'sticky', top: 0,
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '0 6px' }}>
        <img
          src="/logo.png"
          alt="Logo"
          style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'contain', background: '#fff', padding: 4 }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div>
          <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '.03em' }}>TRIPLE-E</div>
          <div style={{ fontSize: 10, color: '#9fb0c4', fontWeight: 700, letterSpacing: '.06em' }}>FOLDER MANAGEMENT</div>
        </div>
      </div>

      {/* Workspace links */}
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#72839a', fontWeight: 900, margin: '0 0 8px 6px' }}>
        Workspace
      </div>
      <nav style={{ display: 'grid', gap: 2, marginBottom: 24 }}>
        {workspaceLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to + label}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              color: isActive ? '#fff' : '#b5c2d1',
              background: isActive ? '#0f766e' : 'transparent',
              textDecoration: 'none', fontWeight: 700, fontSize: 14,
              transition: 'background 0.15s',
            })}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Admin links */}
      {uniqueAdminLinks.length > 0 && (
        <>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#72839a', fontWeight: 900, margin: '0 0 8px 6px' }}>
            Administration
          </div>
          <nav style={{ display: 'grid', gap: 2, marginBottom: 24 }}>
            {uniqueAdminLinks.map(({ to, label, icon }) => (
              <NavLink
                key={to + label}
                to={to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  color: isActive ? '#fff' : '#b5c2d1',
                  background: isActive ? '#0f766e' : 'transparent',
                  textDecoration: 'none', fontWeight: 700, fontSize: 14,
                  transition: 'background 0.15s',
                })}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      {/* Super Admin badge */}
      {user?.isSuperAdmin && (
        <div style={{
          background: '#101f32', border: '1px solid #24344a',
          borderRadius: 10, padding: '12px 14px', marginBottom: 20,
        }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: '#dbe6f2' }}>Super Admin</div>
          <div style={{ fontSize: 12, color: '#91a3b8', marginTop: 3 }}>All system controls enabled</div>
        </div>
      )}

      {/* User info + logout */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #1e2f45' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Avatar name={user?.fullName} src={user?.profilePhotoUrl} size={38} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{user?.role?.name || 'Super Admin'}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8,
            background: '#1a2d44', border: 'none', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}