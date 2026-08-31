import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function getFileType(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  return 'other';
}

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DocumentDetailsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const [d, setD] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.document(id).then(setD).catch(e => push(e.message, 'error'));
  }, [id]);

  if (!d) return <Spinner />;

  // Supabase URLs zinaanza na 'http', za zamani zinaanza na '/uploads'
  const fileUrl = d.fileUrl?.startsWith('http')
    ? d.fileUrl
    : `${api.baseUrl}${d.fileUrl}`;

  const fileType = getFileType(d.mimeType);
  const canManage = user?.isSuperAdmin || user?.role?.name === 'Admin' || d.uploadedById === user?.id;

  async function del() {
    if (!confirm('Delete this document permanently?')) return;
    setDeleting(true);
    try {
      await api.deleteDocument(id);
      push('Document deleted.');
      nav('/documents');
    } catch (e) {
      push(e.message, 'error');
      setDeleting(false);
    }
  }
function download() {
  const a = document.createElement('a');
  a.href = fileUrl;
  a.download = d.name || 'document';
  a.target = '_blank';
  a.rel = 'noreferrer';
  a.click();
}

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>

      {/* Back link */}
      <Link
        to="/documents"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'var(--color-text-subtle, #6b7280)', fontSize: 14,
          textDecoration: 'none', marginBottom: 20,
        }}
      >
        ← All Documents
      </Link>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', flexWrap: 'wrap', gap: 12,
        marginBottom: 24,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{d.name}</h1>
          <div style={{ marginTop: 6, color: 'var(--color-text-subtle, #6b7280)', fontSize: 14 }}>
            {d.category?.name || 'Uncategorized'} · {d.folder?.name || 'Root'} · {formatSize(d.sizeBytes)}
          </div>
        </div>
        <span style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          background: d.accessLevel === 'PUBLIC' ? '#d1fae5' : '#ccfbf1',
          color: d.accessLevel === 'PUBLIC' ? '#065f46' : '#0f766e',
        }}>
          {d.accessLevel}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Preview Panel */}
        <div style={{
          background: 'var(--color-surface, #fff)',
          border: '1px solid var(--color-border, #e5e7eb)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 18px', borderBottom: '1px solid var(--color-border, #e5e7eb)',
            fontSize: 13, fontWeight: 600, color: 'var(--color-text-subtle, #6b7280)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Preview
          </div>

          <div style={{
            minHeight: 320, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--color-bg, #f9fafb)',
            padding: 16,
          }}>
            {fileType === 'image' && (
              <img
                src={fileUrl}
                alt={d.name}
                style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 8, objectFit: 'contain' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            {fileType === 'pdf' && (
              <iframe
                src={fileUrl}
                title={d.name}
                style={{ width: '100%', height: 500, border: 'none', borderRadius: 8 }}
              />
            )}
            {fileType === 'video' && (
              <video
                src={fileUrl}
                controls
                style={{ maxWidth: '100%', maxHeight: 480, borderRadius: 8 }}
              />
            )}
            {fileType === 'other' && (
              <div style={{ textAlign: 'center', color: 'var(--color-text-subtle, #6b7280)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                <div style={{ fontSize: 14 }}>Preview not available for this file type.</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{d.mimeType}</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{
            padding: '14px 18px', borderTop: '1px solid var(--color-border, #e5e7eb)',
            display: 'flex', gap: 10,
          }}>
            <button
              onClick={download}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: 'var(--color-primary, #0f766e)', color: '#fff',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              ⬇ Download
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8,
                border: '1px solid var(--color-border, #e5e7eb)',
                background: 'transparent', color: 'var(--color-text, #111)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                textDecoration: 'none',
              }}
            >
              ↗ Open
            </a>
            {canManage && (
              <button
                onClick={del}
                disabled={deleting}
                style={{
                  padding: '10px 16px', borderRadius: 8, border: 'none',
                  background: '#fee2e2', color: '#b91c1c',
                  fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}
              >
                {deleting ? '...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Description */}
          <div style={{
            background: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: 12, padding: 18,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-subtle, #6b7280)', marginBottom: 8 }}>
              DESCRIPTION
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              {d.description || 'No description provided.'}
            </p>
          </div>

          {/* File details */}
          <div style={{
            background: 'var(--color-surface, #fff)',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: 12, padding: 18,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-subtle, #6b7280)', marginBottom: 12 }}>
              FILE DETAILS
            </div>
            {[
              { label: 'Uploaded by', value: d.uploadedBy?.fullName || '—' },
              { label: 'Date', value: formatDate(d.createdAt) },
              { label: 'Size', value: formatSize(d.sizeBytes) },
              { label: 'Type', value: d.mimeType || '—' },
              { label: 'Category', value: d.category?.name || '—' },
              { label: 'Folder', value: d.folder?.name || 'Root' },
              { label: 'Access', value: d.accessLevel },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '7px 0',
                borderBottom: '1px solid var(--color-border, #f3f4f6)',
                fontSize: 13,
              }}>
                <span style={{ color: 'var(--color-text-subtle, #6b7280)' }}>{label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
