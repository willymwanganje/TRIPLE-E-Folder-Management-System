import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';

/* ─── Sidebar nav items ─── */
const NAV = [
  { key: 'overview',    label: 'Overview',           icon: 'ti-layout-dashboard' },
  { key: 'categories',  label: 'Categories',          icon: 'ti-tag' },
  { key: 'roles',       label: 'Roles & permissions', icon: 'ti-shield-check' },
  { key: 'settings',    label: 'Settings',            icon: 'ti-settings' },
  { key: 'audit',       label: 'Audit logs',          icon: 'ti-history' },
];

/* ─── Action badge colours ─── */
const ACTION_STYLE = {
  UPLOAD:  { bg: '#d1fae5', color: '#065f46' },
  CREATE:  { bg: '#d1fae5', color: '#065f46' },
  READ:    { bg: '#dbeafe', color: '#1e40af' },
  UPDATE:  { bg: '#fef3c7', color: '#92400e' },
  DELETE:  { bg: '#fee2e2', color: '#991b1b' },
};

/* ─── Inline styles (avoids class-name drift in any CSS setup) ─── */
const s = {
  shell:      { display:'flex', height:'100vh', fontFamily:'Inter, system-ui, sans-serif', fontSize:14, color:'#111827' },
  sidebar:    { width:228, background:'#fff', borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', flexShrink:0 },
  brand:      { padding:'20px 18px 16px', borderBottom:'1px solid #e5e7eb' },
  brandName:  { fontSize:15, fontWeight:700, color:'#111827', letterSpacing:'-0.3px' },
  brandSub:   { fontSize:11, color:'#9ca3af', marginTop:2 },
  nav:        { flex:1, padding:'10px 8px', overflowY:'auto' },
  navSection: { fontSize:10, fontWeight:600, color:'#9ca3af', padding:'12px 10px 5px', letterSpacing:'0.6px', textTransform:'uppercase' },
  navItem:    (active) => ({
    display:'flex', alignItems:'center', gap:9, padding:'8px 10px',
    borderRadius:8, cursor:'pointer', fontSize:13.5,
    color: active ? '#1d4ed8' : '#6b7280',
    background: active ? '#eff6ff' : 'transparent',
    fontWeight: active ? 600 : 400,
    marginBottom:2, transition:'all .12s',
    border:'none', width:'100%', textAlign:'left',
  }),
  sidebarFooter: { padding:'14px 12px', borderTop:'1px solid #e5e7eb' },
  userChip:   { display:'flex', alignItems:'center', gap:9 },
  avatar:     { width:30, height:30, borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#1d4ed8', flexShrink:0 },
  main:       { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  topbar:     { padding:'12px 24px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff' },
  content:    { flex:1, overflowY:'auto', padding:'22px 24px', background:'#f9fafb' },
  tabBar:     { display:'flex', gap:2, marginBottom:22, background:'#f3f4f6', padding:4, borderRadius:10, width:'fit-content' },
  tab:        (active) => ({
    padding:'7px 14px', borderRadius:8, fontSize:13, cursor:'pointer',
    color: active ? '#111827' : '#6b7280',
    background: active ? '#fff' : 'transparent',
    fontWeight: active ? 600 : 400,
    border: active ? '1px solid #e5e7eb' : '1px solid transparent',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
    transition:'all .12s', fontFamily:'inherit',
  }),
  metrics:    { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 },
  metric:     { background:'#fff', borderRadius:10, padding:'16px 18px', border:'1px solid #e5e7eb' },
  metricLbl:  { fontSize:11, color:'#9ca3af', fontWeight:600, marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' },
  metricVal:  { fontSize:28, fontWeight:700, color:'#111827', lineHeight:1 },
  metricSub:  { fontSize:11, color:'#6b7280', marginTop:4 },
  gridSplit:  { display:'grid', gridTemplateColumns:'1fr 320px', gap:14 },
  card:       { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, overflow:'hidden' },
  cardHead:   { padding:'14px 18px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' },
  cardTitle:  { fontSize:14, fontWeight:600, color:'#111827' },
  cardSub:    { fontSize:12, color:'#9ca3af', marginTop:1 },
  row:        { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom:'1px solid #f3f4f6' },
  badge:      (type) => {
    const c = ACTION_STYLE[type] || { bg:'#f3f4f6', color:'#374151' };
    return { padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:600, background:c.bg, color:c.color };
  },
  btnSm:      { padding:'5px 12px', borderRadius:8, fontSize:12, fontFamily:'inherit', cursor:'pointer', border:'1px solid #e5e7eb', background:'#fff', color:'#374151', transition:'background .12s' },
  btnPrimary: { padding:'6px 14px', borderRadius:8, fontSize:12, fontFamily:'inherit', cursor:'pointer', border:'none', background:'#1d4ed8', color:'#fff', fontWeight:600 },
  btnDanger:  { padding:'5px 12px', borderRadius:8, fontSize:12, fontFamily:'inherit', cursor:'pointer', border:'1px solid #fecaca', background:'#fff', color:'#dc2626' },
  docIcon:    { width:32, height:32, borderRadius:8, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
  input:      { padding:'7px 10px', borderRadius:8, border:'1px solid #e5e7eb', fontSize:13, fontFamily:'inherit', outline:'none', flex:1 },
  catTrack:   { flex:1, height:4, background:'#f3f4f6', borderRadius:4, margin:'0 14px', overflow:'hidden' },
};

/* ─── Stat card ─── */
function MetricCard({ label, value, sub }) {
  return (
    <div style={s.metric}>
      <div style={s.metricLbl}>{label}</div>
      <div style={s.metricVal}>{value}</div>
      {sub && <div style={s.metricSub}>{sub}</div>}
    </div>
  );
}

/* ─── Role permission editor ─── */
function RoleEditor({ role, perms, onSave }) {
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState(role.permissions.map(x => x.permissionId));
  const toggle = (id) => setIds(x => x.includes(id) ? x.filter(v => v !== id) : [...x, id]);
  return (
    <div style={{ width: '100%' }}>
      {open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 12px' }}>
          {perms.map(p => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={ids.includes(p.id)}
                onChange={() => toggle(p.id)}
                style={{ accentColor: '#1d4ed8' }}
              />
              <span style={{ color: '#374151' }}>{p.name}</span>
            </label>
          ))}
        </div>
      )}
      <button
        style={s.btnSm}
        onClick={async () => {
          if (open) { await onSave({ name: role.name, permissionIds: ids }); setOpen(false); }
          else setOpen(true);
        }}
      >
        {open ? 'Save permissions' : 'Edit permissions'}
      </button>
    </div>
  );
}

/* ─── Main dashboard ─── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const isSA = user?.isSuperAdmin;
  const tab = isSA ? (params.get('panel') || 'overview') : 'overview';

  const [d, setD] = useState(null);
  const [cats, setCats] = useState([]);
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);
  const [settings, setSettings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newCat, setNewCat] = useState({ name: '', description: '' });

  useEffect(() => {
    api.dashboard().then(setD).catch(e => push(e.message, 'error'));
  }, []);

  useEffect(() => {
    if (!isSA) return;
    Promise.all([api.categories(), api.roles(), api.permissions(), api.settings(), api.auditLogs()])
      .then(([a, b, c, s, l]) => {
        setCats(a); setRoles(b); setPerms(c); setSettings(s); setLogs(l);
      })
      .catch(e => push(e.message, 'error'));
  }, [isSA]);

  if (!d) return <Spinner />;

  const go = (x) => setParams(x === 'overview' ? {} : { panel: x });

  const refresh = () =>
    Promise.all([api.dashboard(), api.categories(), api.roles(), api.permissions(), api.settings(), api.auditLogs()])
      .then(([a, b, c, sv, l]) => { setD(a); setCats(b); setRoles(c); setPerms(c); setSettings(sv); setLogs(l); });

  async function addCategory() {
    if (!newCat.name.trim()) return;
    try { await api.createCategory(newCat); setNewCat({ name: '', description: '' }); await refresh(); push('Category created.'); }
    catch (e) { push(e.message, 'error'); }
  }

  async function saveSetting(row) {
    try { await api.updateSetting({ key: row.key, value: row.value }); push('Setting saved.'); }
    catch (e) { push(e.message, 'error'); }
  }

  /* initials from full name */
  const initials = (name = '') => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const currentNav = NAV.find(n => n.key === tab);

  return (
    <div style={s.shell}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandName}>TRIPLE‑E</div>
          <div style={s.brandSub}>{isSA ? 'Master control center' : 'Document workspace'}</div>
        </div>

        <nav style={s.nav}>
          {isSA ? (
            <>
              <div style={s.navSection}>Main</div>
              {NAV.slice(0, 3).map(n => (
                <button key={n.key} style={s.navItem(tab === n.key)} onClick={() => go(n.key)}>
                  <i className={`ti ${n.icon}`} aria-hidden="true" style={{ fontSize: 15 }} />
                  {n.label}
                </button>
              ))}
              <div style={s.navSection}>System</div>
              {NAV.slice(3).map(n => (
                <button key={n.key} style={s.navItem(tab === n.key)} onClick={() => go(n.key)}>
                  <i className={`ti ${n.icon}`} aria-hidden="true" style={{ fontSize: 15 }} />
                  {n.label}
                </button>
              ))}
            </>
          ) : (
            <button style={s.navItem(true)}>
              <i className="ti ti-layout-dashboard" aria-hidden="true" style={{ fontSize: 15 }} />
              Overview
            </button>
          )}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.userChip}>
            <div style={s.avatar}>{initials(user?.fullName)}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{user?.fullName}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{user?.role?.name}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={s.main}>
        {/* Topbar */}
        <div style={s.topbar}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
              {isSA ? 'Master dashboard' : 'Workspace dashboard'}
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
              {currentNav?.label || 'Overview'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ede9fe', color: '#5b21b6', fontSize: 11, fontWeight: 600 }}>
              {user?.role?.name}
            </span>
            <button style={s.btnSm} onClick={refresh} title="Refresh">
              <i className="ti ti-refresh" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={s.content}>
          {/* Tab bar (super admin only) */}
          {isSA && (
            <div style={s.tabBar}>
              {NAV.map(n => (
                <button key={n.key} style={s.tab(tab === n.key)} onClick={() => go(n.key)}>
                  {n.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <>
              <div style={s.metrics}>
                {Object.entries(d.counts).map(([k, v]) => (
                  <MetricCard key={k} label={k} value={v} />
                ))}
              </div>
              <div style={s.gridSplit}>
                {/* Recent activity */}
                <div style={s.card}>
                  <div style={s.cardHead}>
                    <div>
                      <div style={s.cardTitle}>Recent activity</div>
                      <div style={s.cardSub}>Latest uploaded documents</div>
                    </div>
                    <button style={s.btnSm}>View all</button>
                  </div>
                  {d.recentDocuments.map(x => (
                    <div key={x.id} style={s.row}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={s.docIcon}>
                          <i className="ti ti-file-text" style={{ fontSize: 15, color: '#1d4ed8' }} aria-hidden="true" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{x.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                            {x.category?.name} · {x.uploadedBy?.fullName}
                          </div>
                        </div>
                      </div>
                      <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#dbeafe', color: '#1e40af' }}>
                        Document
                      </span>
                    </div>
                  ))}
                </div>

                {/* By category */}
                <div style={s.card}>
                  <div style={s.cardHead}><div style={s.cardTitle}>By category</div></div>
                  {d.byCategory.map((x, i) => {
                    const colors = ['#1d4ed8', '#d97706', '#059669', '#7c3aed'];
                    const max = d.byCategory[0]?._count?.documents || 1;
                    const pct = Math.round((x._count.documents / max) * 100);
                    return (
                      <div key={x.name} style={{ display: 'flex', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ fontSize: 13, color: '#374151', width: 90 }}>{x.name}</span>
                        <div style={s.catTrack}>
                          <div style={{ height: '100%', borderRadius: 4, background: colors[i % colors.length], width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 32, textAlign: 'right' }}>
                          {x._count.documents}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Categories ── */}
          {tab === 'categories' && (
            <>
              <div style={{ ...s.card, padding: 18, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Add category</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    style={s.input}
                    placeholder="Category name"
                    value={newCat.name}
                    onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                  />
                  <input
                    style={{ ...s.input, flex: 2 }}
                    placeholder="Description"
                    value={newCat.description}
                    onChange={e => setNewCat({ ...newCat, description: e.target.value })}
                  />
                  <button style={s.btnPrimary} onClick={addCategory}>Add</button>
                </div>
              </div>
              <div style={s.card}>
                <div style={s.cardHead}>
                  <div>
                    <div style={s.cardTitle}>Categories</div>
                    <div style={s.cardSub}>Super Admin controls the catalogue</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{cats.length} total</span>
                </div>
                {cats.map(c => (
                  <div key={c.id} style={s.row}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{c.description}</div>
                    </div>
                    <button
                      style={s.btnDanger}
                      onClick={async () => {
                        if (confirm(`Delete "${c.name}"?`)) {
                          try { await api.deleteCategory(c.id); await refresh(); push('Category deleted.'); }
                          catch (e) { push(e.message, 'error'); }
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Roles ── */}
          {tab === 'roles' && (
            <div style={s.card}>
              <div style={s.cardHead}>
                <div>
                  <div style={s.cardTitle}>Roles & permission matrix</div>
                  <div style={s.cardSub}>Master policy layer — use Users & Access for per-user overrides</div>
                </div>
              </div>
              {roles.map(r => (
                <div key={r.id} style={{ padding: '16px 18px', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                        {r._count.users} users · {r.permissions.length} permissions
                      </div>
                    </div>
                    {r.name === 'Super Admin' && (
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ede9fe', color: '#5b21b6', fontSize: 11, fontWeight: 600 }}>
                        Protected
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: r.name !== 'Super Admin' ? 12 : 0 }}>
                    {perms.map(p => {
                      const has = r.name === 'Super Admin' || r.permissions.some(x => x.permissionId === p.id);
                      return (
                        <span key={p.id} style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: has ? '#d1fae5' : '#f3f4f6',
                          color: has ? '#065f46' : '#9ca3af',
                        }}>
                          {has ? '✓' : '—'} {p.name}
                        </span>
                      );
                    })}
                  </div>
                  {r.name !== 'Super Admin' && (
                    <RoleEditor
                      role={r}
                      perms={perms}
                      onSave={async (data) => {
                        try { await api.updateRole(r.id, data); await refresh(); push('Role permissions updated.'); }
                        catch (e) { push(e.message, 'error'); }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Settings ── */}
          {tab === 'settings' && (
            <div style={s.card}>
              <div style={s.cardHead}>
                <div style={s.cardTitle}>System settings</div>
                <div style={s.cardSub}>Managed from this panel</div>
              </div>
              {settings.map((sv, i) => (
                <div key={sv.key} style={s.row}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{sv.key}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Managed from UI</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, width: '45%' }}>
                    <input
                      style={s.input}
                      value={sv.value}
                      onChange={e => setSettings(settings.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                    />
                    <button style={s.btnPrimary} onClick={() => saveSetting(sv)}>Save</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Audit logs ── */}
          {tab === 'audit' && (
            <div style={{ ...s.card, overflow: 'hidden' }}>
              <div style={s.cardHead}>
                <div>
                  <div style={s.cardTitle}>Audit logs</div>
                  <div style={s.cardSub}>Latest 300 recorded actions</div>
                </div>
                <button style={s.btnSm}>
                  <i className="ti ti-download" aria-hidden="true" style={{ marginRight: 4 }} />
                  Export
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Time', 'User', 'Action', 'Entity', 'ID'].map(h => (
                        <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontWeight: 600, color: '#9ca3af', borderBottom: '1px solid #e5e7eb', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '11px 18px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '11px 18px', color: '#111827', fontWeight: 500 }}>
                          {l.user?.fullName || 'System'}
                        </td>
                        <td style={{ padding: '11px 18px' }}>
                          <span style={s.badge(l.action)}>{l.action}</span>
                        </td>
                        <td style={{ padding: '11px 18px', color: '#6b7280' }}>{l.entity}</td>
                        <td style={{ padding: '11px 18px', color: '#9ca3af' }}>{l.entityId || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}