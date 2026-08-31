import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function UploadDocumentPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [filteredFolders, setFilteredFolders] = useState([]);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', categoryId: '', folderId: '', accessLevel: 'PUBLIC',
  });

  useEffect(() => {
    Promise.all([api.categories(), api.folders()])
      .then(([cats, fols]) => { setCategories(cats); setFolders(fols); })
      .catch(e => push(e.message, 'error'));
  }, []);

  // Filter folders by selected category
  useEffect(() => {
    if (!form.categoryId) {
      setFilteredFolders(folders);
    } else {
      setFilteredFolders(folders.filter(f => f.categoryId === form.categoryId));
    }
    setForm(prev => ({ ...prev, folderId: '' }));
  }, [form.categoryId, folders]);

  const canRestrict = user?.isSuperAdmin || user?.role?.name === 'Admin';

  async function submit(e) {
    e.preventDefault();
    if (!file) return push('Please select a file.', 'error');
    if (!form.categoryId) return push('Please select a category.', 'error');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
      await api.uploadDocument(fd);
      push('Document uploaded successfully.');
      nav('/documents');
    } catch (e) {
      push(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Upload Document</h1>
          <div className="subtle">Upload files into categories and folders.</div>
        </div>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: 28, maxWidth: 780 }}>

        {/* File picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
            File <span style={{ color: '#e11d48' }}>*</span>
          </label>
          <input
            type="file"
            required
            onChange={e => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              if (f && !form.name) setForm(prev => ({ ...prev, name: f.name.replace(/\.[^.]+$/, '') }));
            }}
          />
          {file && (
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>

        <div className="form-grid">
          {/* Document name */}
          <label>
            Document name
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Leave blank to use filename"
            />
          </label>

          {/* Category */}
          <label>
            Category <span style={{ color: '#e11d48' }}>*</span>
            <select
              required
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Select category</option>
              {categories.map(x => (
                <option key={x.id} value={x.id}>{x.name}</option>
              ))}
            </select>
          </label>

          {/* Folder */}
          <label>
            Folder
            <select
              value={form.folderId}
              onChange={e => setForm({ ...form, folderId: e.target.value })}
            >
              <option value="">Root (no folder)</option>
              {filteredFolders.map(x => (
                <option key={x.id} value={x.id}>{x.name}</option>
              ))}
            </select>
          </label>

          {/* Access level */}
          {canRestrict ? (
            <label>
              Access level
              <select
                value={form.accessLevel}
                onChange={e => setForm({ ...form, accessLevel: e.target.value })}
              >
                <option value="PUBLIC">PUBLIC — visible to all permitted users</option>
                <option value="RESTRICTED">RESTRICTED — controlled list</option>
                <option value="PRIVATE">PRIVATE — owner and managers only</option>
              </select>
            </label>
          ) : (
            <div />
          )}
        </div>

        {/* Description */}
        <label style={{ display: 'block', marginTop: 16 }}>
          Description
          <textarea
            rows="4"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description..."
            style={{ marginTop: 6, width: '100%', resize: 'vertical' }}
          />
        </label>

        <button
          className="btn btn-primary"
          disabled={saving}
          style={{ marginTop: 20, minWidth: 140 }}
        >
          {saving ? 'Uploading…' : '⬆ Upload document'}
        </button>
      </form>
    </div>
  );
}