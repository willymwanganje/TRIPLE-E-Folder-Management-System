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
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
    let mounted = true;

    api.document(id)
      .then(data => {
        if (mounted) setD(data);
      })
      .catch(e => {
        if (mounted) push(e.message, 'error');
      });

    return () => {
      mounted = false;
    };
  }, [id, push]);

  if (!d) {
    return <Spinner />;
  }

  const fileUrl = d.fileUrl?.startsWith('http')
    ? d.fileUrl
    : `${api.baseUrl}${d.fileUrl}`;

  const fileType = getFileType(d.mimeType);

  const canManage =
    user?.isSuperAdmin ||
    user?.role?.name === 'Admin' ||
    d.uploadedById === user?.id;

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

  async function download() {
  try {
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error('Failed to download the file.');
    }

    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = d.name || 'document';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download error:', error);
    push('Unable to download the file. Please try again.', 'error');
  }
}
  return (
    <>
      {/* =========================================================
          RESPONSIVE STYLES
          ========================================================= */}
      <style>{`
        .document-details-page {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          padding: 24px 20px;
          box-sizing: border-box;
        }

        .document-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 24px;
        }

        .document-title {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.3;
          word-break: break-word;
        }

        .document-subtitle {
          margin-top: 6px;
          color: var(--color-text-subtle, #6b7280);
          font-size: 14px;
          line-height: 1.5;
        }

        .document-content {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 20px;
          align-items: start;
          width: 100%;
        }

        .preview-panel {
          min-width: 0;
          width: 100%;
          background: var(--color-surface, #fff);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 12px;
          overflow: hidden;
        }

        .preview-title {
          padding: 14px 18px;
          border-bottom: 1px solid var(--color-border, #e5e7eb);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text-subtle, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .preview-area {
          min-height: 320px;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg, #f9fafb);
          padding: 16px;
          overflow: hidden;
        }

        .preview-image {
          display: block;
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 480px;
          border-radius: 8px;
          object-fit: contain;
        }

        .preview-pdf {
          display: block;
          width: 100%;
          height: 500px;
          border: none;
          border-radius: 8px;
        }

        .preview-video {
          display: block;
          width: auto;
          height: auto;
          max-width: 100%;
          max-height: 480px;
          border-radius: 8px;
        }

        .preview-empty {
          width: 100%;
          text-align: center;
          color: var(--color-text-subtle, #6b7280);
        }

        .preview-empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .preview-empty-text {
          font-size: 14px;
        }

        .preview-empty-type {
          font-size: 12px;
          margin-top: 4px;
          word-break: break-word;
        }

        .action-buttons {
          padding: 14px 18px;
          border-top: 1px solid var(--color-border, #e5e7eb);
          display: flex;
          gap: 10px;
        }

        .download-button {
          flex: 1;
          padding: 10px 0;
          border-radius: 8px;
          border: none;
          background: var(--color-primary, #0f766e);
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .delete-button {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          background: #fee2e2;
          color: #b91c1c;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .delete-button:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .info-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
          width: 100%;
        }

        .info-card {
          width: 100%;
          box-sizing: border-box;
          background: var(--color-surface, #fff);
          border: 1px solid var(--color-border, #e5e7eb);
          border-radius: 12px;
          padding: 18px;
        }

        .info-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-subtle, #6b7280);
          margin-bottom: 8px;
        }

        .description-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .details-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-subtle, #6b7280);
          margin-bottom: 12px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 7px 0;
          border-bottom: 1px solid var(--color-border, #f3f4f6);
          font-size: 13px;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: var(--color-text-subtle, #6b7280);
          flex-shrink: 0;
        }

        .detail-value {
          font-weight: 500;
          text-align: right;
          max-width: 65%;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        /*
         * TABLET
         */
        @media (max-width: 800px) {
          .document-content {
            grid-template-columns: 1fr;
          }

          .info-panel {
            width: 100%;
          }

          .preview-area {
            min-height: 280px;
          }

          .preview-image {
            max-height: 520px;
          }
        }

        /*
         * MOBILE
         */
        @media (max-width: 600px) {
          .document-details-page {
            padding: 18px 14px 30px;
          }

          .document-header {
            margin-bottom: 18px;
          }

          .document-title {
            font-size: 21px;
          }

          .document-subtitle {
            font-size: 13px;
          }

          .document-content {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          /*
           * Preview FIRST on mobile.
           */
          .preview-panel {
            order: 1;
          }

          .info-panel {
            order: 2;
          }

          .preview-area {
            min-height: 250px;
            padding: 12px;
          }

          .preview-image {
            width: auto;
            max-width: 100%;
            max-height: 420px;
          }

          .preview-pdf {
            height: 450px;
          }

          .preview-video {
            max-width: 100%;
            max-height: 420px;
          }

          .preview-title {
            padding: 12px 14px;
          }

          .action-buttons {
            padding: 12px 14px;
          }

          .info-card {
            padding: 15px;
          }

          .detail-row {
            gap: 10px;
          }

          .detail-value {
            max-width: 58%;
          }
        }

        /*
         * VERY SMALL PHONES
         */
        @media (max-width: 380px) {
          .document-details-page {
            padding-left: 10px;
            padding-right: 10px;
          }

          .document-title {
            font-size: 19px;
          }

          .preview-area {
            min-height: 220px;
          }

          .preview-image {
            max-height: 350px;
          }

          .preview-pdf {
            height: 400px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .download-button,
          .delete-button {
            width: 100%;
          }

          .detail-row {
            flex-direction: column;
            gap: 3px;
          }

          .detail-value {
            max-width: 100%;
            text-align: left;
          }
        }
      `}</style>

      <div className="document-details-page">

        {/* Back link */}
        <Link
          to="/documents"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--color-text-subtle, #6b7280)',
            fontSize: 14,
            textDecoration: 'none',
            marginBottom: 20,
          }}
        >
          ← All Documents
        </Link>

        {/* =========================================================
            HEADER
            ========================================================= */}
        <div className="document-header">

          <div style={{ minWidth: 0 }}>
            <h1 className="document-title">
              {d.name}
            </h1>

            <div className="document-subtitle">
              {d.category?.name || 'Uncategorized'}
              {' · '}
              {d.folder?.name || 'Root'}
              {' · '}
              {formatSize(d.sizeBytes)}
            </div>
          </div>

          <span
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background:
                d.accessLevel === 'PUBLIC'
                  ? '#d1fae5'
                  : '#ccfbf1',
              color:
                d.accessLevel === 'PUBLIC'
                  ? '#065f46'
                  : '#0f766e',
              flexShrink: 0,
            }}
          >
            {d.accessLevel}
          </span>

        </div>

        {/* =========================================================
            CONTENT
            ========================================================= */}
        <div className="document-content">

          {/* =======================================================
              PREVIEW PANEL
              ======================================================= */}
          <div className="preview-panel">

            <div className="preview-title">
              Preview
            </div>

            <div className="preview-area">

              {/* IMAGE */}
              {fileType === 'image' && (
                <img
                  src={fileUrl}
                  alt={d.name}
                  className="preview-image"
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}

              {/* PDF */}
              {fileType === 'pdf' && (
                <iframe
                  src={fileUrl}
                  title={d.name}
                  className="preview-pdf"
                />
              )}

              {/* VIDEO */}
              {fileType === 'video' && (
                <video
                  src={fileUrl}
                  controls
                  className="preview-video"
                />
              )}

              {/* OTHER */}
              {fileType === 'other' && (
                <div className="preview-empty">

                  <div className="preview-empty-icon">
                    📄
                  </div>

                  <div className="preview-empty-text">
                    Preview not available for this file type.
                  </div>

                  <div className="preview-empty-type">
                    {d.mimeType}
                  </div>

                </div>
              )}

            </div>

            {/* =====================================================
                ACTION BUTTONS
                ===================================================== */}
            <div className="action-buttons">

              <button
                onClick={download}
                className="download-button"
              >
                ⬇ Download
              </button>

              {canManage && (
                <button
                  onClick={del}
                  disabled={deleting}
                  className="delete-button"
                >
                  {deleting ? '...' : 'Delete'}
                </button>
              )}

            </div>

          </div>

          {/* =======================================================
              INFO PANEL
              ======================================================= */}
          <div className="info-panel">

            {/* DESCRIPTION */}
            <div className="info-card">

              <div className="info-label">
                DESCRIPTION
              </div>

              <p className="description-text">
                {d.description || 'No description provided.'}
              </p>

            </div>

            {/* FILE DETAILS */}
            <div className="info-card">

              <div className="details-label">
                FILE DETAILS
              </div>

              {[
                {
                  label: 'Uploaded by',
                  value: d.uploadedBy?.fullName || '—',
                },
                {
                  label: 'Date',
                  value: formatDate(d.createdAt),
                },
                {
                  label: 'Size',
                  value: formatSize(d.sizeBytes),
                },
                {
                  label: 'Type',
                  value: d.mimeType || '—',
                },
                {
                  label: 'Category',
                  value: d.category?.name || '—',
                },
                {
                  label: 'Folder',
                  value: d.folder?.name || 'Root',
                },
                {
                  label: 'Access',
                  value: d.accessLevel || '—',
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="detail-row"
                >
                  <span className="detail-label">
                    {label}
                  </span>

                  <span className="detail-value">
                    {value}
                  </span>
                </div>
              ))}

            </div>

          </div>

        </div>

      </div>
    </>
  );
}