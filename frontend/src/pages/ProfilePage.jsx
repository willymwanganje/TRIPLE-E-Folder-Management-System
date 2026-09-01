import { useEffect, useState } from 'react';
import { api } from '../services/api';
import Avatar from '../components/Avatar';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ paddingRight: 44 }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{
          position: 'absolute', top: '50%', right: 10,
          transform: 'translateY(-50%)',
          background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 18,
          color: '#64748b', padding: 4,
        }}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? '◉' : '◌'}
      </button>
    </div>
  );
}

export default function ProfilePage() {
  const [p, setP] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const { push } = useToast();
  const { refresh } = useAuth();

  useEffect(() => {
    api.profile().then(setP).catch(e => push(e.message, 'error'));
  }, []);

  if (!p) return <div className="card" style={{ padding: 25 }}>Loading profile…</div>;

  const photoUrl = p.profilePhotoUrl?.startsWith('http')
    ? p.profilePhotoUrl
    : p.profilePhotoUrl ? `${api.baseUrl}${p.profilePhotoUrl}` : null;

  async function save() {
    setSaving(true);
    try {
      const data = await api.saveProfile({ fullName: p.fullName, phone: p.phone, profilePhotoUrl: p.profilePhotoUrl });
      setP(data); await refresh();
      push('Profile updated successfully.');
    } catch (e) { push(e.message, 'error'); }
    finally { setSaving(false); }
  }

  async function uploadPhoto() {
    if (!photo) return;
    try {
      const fd = new FormData();
      fd.append('photo', photo);
      const data = await api.uploadProfilePhoto(fd);
      setP(data); await refresh(); setPhoto(null);
      push('Profile photo updated.');
    } catch (e) { push(e.message, 'error'); }
  }

  async function change() {
    if (pw.newPassword !== pw.confirm) return push('New passwords do not match.', 'error');
    if (pw.newPassword.length < 8) return push('New password must be at least 8 characters.', 'error');
    setChangingPw(true);
    try {
      await api.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      push('Password changed successfully.');
    } catch (e) { push(e.message, 'error'); }
    finally { setChangingPw(false); }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>My Profile</h1>
          <div className="subtle">Manage your account details and security.</div>
        </div>
      </div>

      <div className="grid-3">
        {/* Profile info */}
        <section className="card" style={{ padding: 22, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 25 }}>
            <Avatar name={p.fullName} src={photoUrl} size={80} />
            <div>
              <h2 style={{ marginBottom: 4 }}>{p.fullName}</h2>
              <div className="subtle">{p.role?.name} · {p.email}</div>
            </div>
          </div>
          <div className="form-grid">
            <label>Full name<input value={p.fullName || ''} onChange={e => setP({ ...p, fullName: e.target.value })} /></label>
            <label>Email<input value={p.email} disabled /></label>
            <label>Phone<input value={p.phone || ''} onChange={e => setP({ ...p, phone: e.target.value })} /></label>
            <label>Account status<input value={p.isActive ? 'Active' : 'Inactive'} disabled /></label>
          </div>
          <button className="btn btn-primary" disabled={saving} onClick={save} style={{ marginTop: 18 }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </section>

        {/* Photo upload */}
        <section className="card" style={{ padding: 22 }}>
          <h3>Profile photo</h3>
          <p className="subtle" style={{ fontSize: 13 }}>JPG/PNG/WebP up to 5 MB.</p>
          {photoUrl && (
            <img src={photoUrl} alt="Profile"
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', marginBottom: 12, border: '2px solid #e5e7eb' }}
            />
          )}
          <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} style={{ display: 'block', marginBottom: 12 }} />
          {photo && <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{photo.name}</div>}
          <button className="btn btn-light" onClick={uploadPhoto} disabled={!photo}>Upload photo</button>
        </section>
      </div>

      {/* Security */}
      <section className="card" style={{ padding: 22, marginTop: 15, maxWidth: 700 }}>
        <h2>Security</h2>
        <div className="form-grid">
          <label>
            Current password
            <PasswordInput
              value={pw.currentPassword}
              onChange={e => setPw({ ...pw, currentPassword: e.target.value })}
              placeholder="Enter current password"
            />
          </label>
          <label>
            New password
            <PasswordInput
              value={pw.newPassword}
              onChange={e => setPw({ ...pw, newPassword: e.target.value })}
              placeholder="At least 8 characters"
            />
          </label>
        </div>
        <label style={{ marginTop: 14, display: 'grid', gap: 7, fontWeight: 700, fontSize: 13 }}>
          Confirm new password
          <PasswordInput
            value={pw.confirm}
            onChange={e => setPw({ ...pw, confirm: e.target.value })}
            placeholder="Repeat new password"
          />
        </label>
        <button className="btn btn-primary" onClick={change} disabled={changingPw} style={{ marginTop: 15 }}>
          {changingPw ? 'Changing…' : 'Change password'}
        </button>
      </section>
    </div>
  );
}