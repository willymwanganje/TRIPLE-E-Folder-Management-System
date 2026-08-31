import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import './DocumentsPage.css';

/* ─── panel tabs (super admin only) ─── */
const PANELS = [
  { key: 'overview',   label: 'Overview',           icon: 'ti-layout-dashboard' },
  { key: 'categories', label: 'Categories',          icon: 'ti-tag' },
  { key: 'roles',      label: 'Roles & permissions', icon: 'ti-shield-check' },
  { key: 'settings',   label: 'Settings',            icon: 'ti-settings' },
  { key: 'audit',      label: 'Audit logs',          icon: 'ti-history' },
];

/* ─── audit action badge colours ─── */
const ACTION_COLOR = {
  UPLOAD:  { bg: '#d1fae5', color: '#065f46' },
  CREATE:  { bg: '#d1fae5', color: '#065f46' },
  READ:    { bg: '#dbeafe', color: '#1e40af' },
  UPDATE:  { bg: '#fef3c7', color: '#92400e' },
  DELETE:  { bg: '#fee2e2', color: '#991b1b' },
};

/* ─── category bar accent colours ─── */
const CAT_COLORS = ['#1d4ed8', '#d97706', '#059669', '#7c3aed', '#db2777'];

/* ─── tiny shared style helpers ─── */
const card   = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' };
const rowEl  = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #f3f4f6' };
const lbl    = { fontSize: 11, color: '#9ca3af', marginTop: 1 };
const btnSm  = { padding: '5px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#374151' };
const btnPri = { padding: '6px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', border: 'none', background: '#1d4ed8', color: '#fff', fontWeight: 600 };
const btnDng = { padding: '5px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid #fecaca', background: '#fff', color: '#dc2626' };
const inp    = { padding: '7px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, fontFamily: 'inherit', outline: 'none', flex: 1 };

/* ─── sub-components ─── */
function CardHead({ title, sub, right }) {
  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</div>
        {sub && <div style={lbl}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

function MetricCard({ label, value, icon }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '16px 18px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        {icon && <i className={`ti ${icon}`} style={{ fontSize: 18, color: '#d1d5db' }} aria-hidden="true" />}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function RoleEditor({ role, perms, onSave }) {
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState(role.permissions.map(x => x.permissionId));
  const toggle = id => setIds(x => x.includes(id) ? x.filter(v => v !== id) : [...x, id]);
  return (
    <div>
      {open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0 12px' }}>
          {perms.map(p => (
            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={ids.includes(p.id)} onChange={() => toggle(p.id)} style={{ accentColor: '#1d4ed8' }} />
              <span style={{ color: '#374151' }}>{p.name}</span>
            </label>
          ))}
        </div>
      )}
      <button
        style={btnSm}
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

/* ─── Main page ─── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [params, setParams] = useSearchParams();
  const isSA = Boolean(user?.isSuperAdmin);
  const panel = isSA ? (params.get('panel') || 'overview') : 'overview';

  /* data state */
  const [d,        setD]        = useState(null);
  const [cats,     setCats]     = useState([]);
  const [roles,    setRoles]    = useState([]);
  const [perms,    setPerms]    = useState([]);
  const [settings, setSettings] = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [newCat,   setNewCat]   = useState({ name: '', description: '' });

  useEffect(() => {
    api.dashboard().then(setD).catch(e => push(e.message, 'error'));
  }, []);

  useEffect(() => {
    if (!isSA) return;
    Promise.all([
      api.categories(), api.roles(), api.permissions(), api.settings(), api.auditLogs(),
    ]).then(([a, b, c, sv, l]) => {
      setCats(a); setRoles(b); setPerms(c); setSettings(sv); setLogs(l);
    }).catch(e => push(e.message, 'error'));
  }, [isSA]);

  if (!d) return <Spinner />;

  const goPanel = key => setParams(key === 'overview' ? {} : { panel: key });

  const refresh = () =>
    Promise.all([
      api.dashboard(), api.categories(), api.roles(), api.permissions(), api.settings(), api.auditLogs(),
    ]).then(([a, b, c, sv, l]) => {
      setD(a); setCats(b); setRoles(b); setPerms(c); setSettings(sv); setLogs(l);
    });

  async function addCategory() {
    if (!newCat.name.trim()) return;
    try { await api.createCategory(newCat); setNewCat({ name: '', description: '' }); await refresh(); push('Category created.'); }
    catch (e) { push(e.message, 'error'); }
  }

  async function saveSetting(row) {
    try { await api.updateSetting({ key: row.key, value: row.value }); push('Setting saved.'); }
    catch (e) { push(e.message, 'error'); }
  }

  const currentPanel = PANELS.find(p => p.key === panel);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f9fafb' }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            {isSA ? 'Master dashboard' : 'Workspace dashboard'}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>
            {currentPanel?.label || 'Overview'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ede9fe', color: '#5b21b6', fontSize: 11, fontWeight: 600 }}>
            {user?.role?.name}
          </span>
          <button style={btnSm} onClick={refresh} title="Refresh">
            <i className="ti ti-refresh" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Panel tab bar (SA only, scrollable on mobile) ── */}
      {isSA && (
        <div style={{
          display: 'flex', gap: 2, padding: '10px 20px 0',
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          overflowX: 'auto', flexShrink: 0,
        }}>
          {PANELS.map(p => {
            const active = panel === p.key;
            return (
              <button
                key={p.key}
                onClick={() => goPanel(p.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px 10px', borderRadius: '8px 8px 0 0',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  color:      active ? '#1d4ed8' : '#6b7280',
                  background: active ? '#f0f7ff' : 'transparent',
                  fontWeight: active ? 700 : 400,
                  border: 'none',
                  borderBottom: active ? '2px solid #1d4ed8' : '2px solid transparent',
                  whiteSpace: 'nowrap', transition: 'all .12s',
                }}
              >
                <i className={`ti ${p.icon}`} style={{ fontSize: 14 }} aria-hidden="true" />
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* ════ OVERVIEW ════ */}
        {panel === 'overview' && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12, marginBottom: 20,
            }}>
              {Object.entries(d.counts).map(([k, v]) => (
                <MetricCard key={k} label={k} value={v} icon="ti-chart-bar" />
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}>
              {/* Recent docs */}
              <div style={card}>
                <CardHead
                  title="Recent activity"
                  sub="Latest uploaded documents"
                  right={<button style={btnSm}>View all</button>}
                />
                {d.recentDocuments.map(x => (
                  <div key={x.id} style={rowEl}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="ti ti-file-text" style={{ fontSize: 15, color: '#1d4ed8' }} aria-hidden="true" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</div>
                        <div style={lbl}>{x.category?.name} · {x.uploadedBy?.fullName}</div>
                      </div>
                    </div>
                    <span style={{ marginLeft: 8, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#dbeafe', color: '#1e40af', flexShrink: 0 }}>Doc</span>
                  </div>
                ))}
              </div>

              {/* By category */}
              <div style={card}>
                <CardHead title="By category" />
                {d.byCategory.map((x, i) => {
                  const max = d.byCategory[0]?._count?.documents || 1;
                  const pct = Math.round((x._count.documents / max) * 100);
                  return (
                    <div key={x.name} style={{ display: 'flex', alignItems: 'center', padding: '11px 18px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#374151', width: 80, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.name}</span>
                      <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 4, margin: '0 12px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: CAT_COLORS[i % CAT_COLORS.length], width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 28, textAlign: 'right' }}>{x._count.documents}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ════ CATEGORIES ════ */}
        {panel === 'categories' && (
          <>
            <div style={{ ...card, padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 12 }}>Add category</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input style={{ ...inp, minWidth: 120 }} placeholder="Category name" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} />
                <input style={{ ...inp, flex: 2, minWidth: 160 }} placeholder="Description" value={newCat.description} onChange={e => setNewCat({ ...newCat, description: e.target.value })} />
                <button style={btnPri} onClick={addCategory}>Add</button>
              </div>
            </div>
            <div style={card}>
              <CardHead title="Categories" sub="Super Admin controls the catalogue" right={<span style={{ fontSize: 12, color: '#6b7280' }}>{cats.length} total</span>} />
              {cats.map(c => (
                <div key={c.id} style={rowEl}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.name}</div>
                    <div style={lbl}>{c.description}</div>
                  </div>
                  <button
                    style={{ ...btnDng, flexShrink: 0, marginLeft: 12 }}
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
              {cats.length === 0 && (
                <div style={{ padding: '24px 18px', color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>
                  No categories yet. Add one above.
                </div>
              )}
            </div>
          </>
        )}

        {/* ════ ROLES ════ */}
        {panel === 'roles' && (
          <div style={card}>
            <CardHead title="Roles & permission matrix" sub="Master policy layer — use Users & Access for per-user overrides" />
            {roles.map(r => (
              <div key={r.id} style={{ padding: '16px 18px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.name}</div>
                    <div style={lbl}>{r._count?.users} users · {r.permissions.length} permissions</div>
                  </div>
                  {r.name === 'Super Admin' && (
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: '#ede9fe', color: '#5b21b6', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>Protected</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: r.name !== 'Super Admin' ? 12 : 0 }}>
                  {perms.map(p => {
                    const has = r.name === 'Super Admin' || r.permissions.some(x => x.permissionId === p.id);
                    return (
                      <span key={p.id} style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: has ? '#d1fae5' : '#f3f4f6',
                        color:      has ? '#065f46' : '#9ca3af',
                      }}>
                        {has ? '✓' : '—'} {p.name}
                      </span>
                    );
                  })}
                </div>
                {r.name !== 'Super Admin' && (
                  <RoleEditor
                    role={r} perms={perms}
                    onSave={async data => {
                      try { await api.updateRole(r.id, data); await refresh(); push('Role permissions updated.'); }
                      catch (e) { push(e.message, 'error'); }
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════ SETTINGS ════ */}
        {panel === 'settings' && (
          <div style={card}>
            <CardHead title="System settings" sub="Managed from this panel" />
            {settings.map((sv, i) => (
              <div key={sv.key} style={{ ...rowEl, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{sv.key}</div>
                  <div style={lbl}>Managed from UI</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 180 }}>
                  <input
                    style={inp}
                    value={sv.value}
                    onChange={e => setSettings(settings.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                  />
                  <button style={{ ...btnPri, flexShrink: 0 }} onClick={() => saveSetting(sv)}>Save</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ AUDIT LOGS ════ */}
        {panel === 'audit' && (
          <div style={{ ...card, overflow: 'hidden' }}>
            <CardHead
              title="Audit logs"
              sub="Latest 300 recorded actions"
              right={
                <button style={btnSm}>
                  <i className="ti ti-download" aria-hidden="true" style={{ marginRight: 4 }} />
                  Export
                </button>
              }
            />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Time', 'User', 'Action', 'Entity', 'ID'].map(h => (
                      <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontWeight: 600, color: '#9ca3af', borderBottom: '1px solid #e5e7eb', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => {
                    const ac = ACTION_COLOR[l.action] || { bg: '#f3f4f6', color: '#374151' };
                    return (
                      <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '11px 18px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleString()}</td>
                        <td style={{ padding: '11px 18px', color: '#111827', fontWeight: 500 }}>{l.user?.fullName || 'System'}</td>
                        <td style={{ padding: '11px 18px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ac.bg, color: ac.color }}>{l.action}</span>
                        </td>
                        <td style={{ padding: '11px 18px', color: '#6b7280' }}>{l.entity}</td>
                        <td style={{ padding: '11px 18px', color: '#9ca3af' }}>{l.entityId || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}