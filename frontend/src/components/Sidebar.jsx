import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const WORKSPACE_LINKS = [
  { to: '/',           label: 'Dashboard',        icon: 'ti-layout-dashboard', perm: null },
  { to: '/documents',  label: 'All documents',     icon: 'ti-files',            perm: 'document.view' },
  { to: '/upload',     label: 'Upload document',   icon: 'ti-cloud-upload',     perm: 'document.create' },
  { to: '/folders',    label: 'Folders',           icon: 'ti-folder',           perm: 'folder.view' },
  { to: '/users',      label: 'Users',             icon: 'ti-users',            perm: 'user.view' },
  { to: '/profile',    label: 'Profile',           icon: 'ti-user-circle',      perm: 'profile.update' },
];

const ADMIN_LINKS = [
  { to: '/categories',        label: 'Categories',         icon: 'ti-tag',          perm: 'category.manage' },
  { to: '/admin/roles',       label: 'Roles & permissions', icon: 'ti-shield-check', perm: 'role.manage' },
  { to: '/admin/audit-logs',  label: 'Audit logs',         icon: 'ti-history',      perm: 'audit.view' },
  { to: '/admin/settings',    label: 'Settings',           icon: 'ti-settings',     perm: 'settings.manage' },
];

/* ─── token colours (dark sidebar) ─── */
const C = {
  bg:         '#0b1728',
  surface:    '#101f32',
  border:     '#1e2f45',
  borderHov:  '#24344a',
  textPrim:   '#f0f4f8',
  textMuted:  '#9fb0c4',
  textSub:    '#72839a',
  active:     '#1d4ed8',
  activeBg:   '#172554',
  danger:     '#ef4444',
};

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();

  const allowed = (perm) =>
    user?.isSuperAdmin || !perm || user?.permissions?.includes(perm);

  const visibleWorkspace = WORKSPACE_LINKS.filter(l => allowed(l.perm));
  const visibleAdmin     = ADMIN_LINKS.filter(l => allowed(l.perm));

  const handleLogout = () => { logout(); onClose?.(); };

  const linkStyle = ({ isActive }) => ({
    display:        'flex',
    alignItems:     'center',
    gap:            10,
    padding:        '8px 10px',
    borderRadius:   8,
    color:          isActive ? C.textPrim : C.textMuted,
    background:     isActive ? C.activeBg : 'transparent',
    borderLeft:     isActive ? `3px solid ${C.active}` : '3px solid transparent',
    textDecoration: 'none',
    fontSize:       13.5,
    fontWeight:     isActive ? 600 : 400,
    transition:     'all .12s',
    minWidth:       0,
  });

  return (
    <>
      {/* ── Sidebar ── */}
      <aside style={{
        width:        240,
        minWidth:     240,
        height:       '100vh',
        display:      'flex',
        flexDirection:'column',
        overflowY:    'auto',
        overflowX:    'hidden',
        background:   C.bg,
        borderRight:  `1px solid ${C.border}`,
        flexShrink:   0,
        /* mobile: hide by default, shown when .open */
      }}>

        {/* Logo */}
        <div style={{ padding: '18px 16px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo.png"
            alt="TRIPLE-E"
            style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 4, flexShrink: 0 }}
            onError={e => e.currentTarget.style.display = 'none'}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.textPrim, letterSpacing: '-0.3px' }}>TRIPLE‑E</div>
            <div style={{ fontSize: 10, color: C.textSub, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Folder Management</div>
          </div>
          {/* mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4 }}
              aria-label="Close menu"
            >
              <i className="ti ti-x" style={{ fontSize: 18 }} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>

          {/* Workspace */}
          <div style={{ fontSize: 10, fontWeight: 600, color: C.textSub, padding: '0 8px 6px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
            Workspace
          </div>
          <div style={{ display: 'grid', gap: 1, marginBottom: 20 }}>
            {visibleWorkspace.map(({ to, label, icon }) => (
              <NavLink key={`${to}-${label}`} to={to} end={to === '/'} style={linkStyle} onClick={onClose}>
                <i className={`ti ${icon}`} style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Administration */}
          {visibleAdmin.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.textSub, padding: '0 8px 6px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                Administration
              </div>
              <div style={{ display: 'grid', gap: 1, marginBottom: 20 }}>
                {visibleAdmin.map(({ to, label, icon }) => (
                  <NavLink key={`${to}-${label}`} to={to} style={linkStyle} onClick={onClose}>
                    <i className={`ti ${icon}`} style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                  </NavLink>
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Super Admin badge */}
        {user?.isSuperAdmin && (
          <div style={{ margin: '0 10px 12px', padding: '10px 12px', border: `1px solid ${C.borderHov}`, borderRadius: 10, background: C.surface }}>
            <div style={{ color: C.textPrim, fontWeight: 600, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-shield-check" style={{ fontSize: 14, color: '#818cf8' }} aria-hidden="true" />
              Super Admin
            </div>
            <div style={{ marginTop: 2, color: C.textSub, fontSize: 11 }}>All system controls enabled</div>
          </div>
        )}

        {/* Footer: user + logout */}
        <div style={{ padding: '12px 10px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, minWidth: 0 }}>
            <Avatar name={user?.fullName || 'User'} src={user?.profilePhotoUrl} size={34} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName || 'User'}
              </div>
              <div style={{ fontSize: 11, color: C.textSub, marginTop: 1 }}>
                {user?.isSuperAdmin ? 'Super Admin' : (user?.role?.name || 'User')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`,
              borderRadius: 8, background: 'transparent', color: C.textMuted,
              fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'all .12s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
          >
            <i className="ti ti-logout" style={{ fontSize: 15 }} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}