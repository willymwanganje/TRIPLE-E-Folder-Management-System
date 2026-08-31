import { useEffect, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';

import Spinner from '../components/Spinner';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function getFileType(mimeType = '') {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType === 'application/pdf') {
    return 'pdf';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  return 'other';
}

function formatSize(bytes) {
  if (!bytes) return '—';

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
}

function formatDate(str) {
  if (!str) return '—';

  const date = new Date(str);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DocumentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuth();
  const { push } = useToast();

  const [documentData, setDocumentData] = useState(null);

  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    accessLevel: 'PRIVATE',
  });

  /*
   * ============================================================
   * LOAD DOCUMENT
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    api.document(id)
      .then((data) => {
        if (!mounted) return;

        setDocumentData(data);

        setForm({
          name: data.name || '',
          description: data.description || '',
          accessLevel: data.accessLevel || 'PRIVATE',
        });
      })
      .catch((error) => {
        if (mounted) {
          push(
            error.message || 'Failed to load document.',
            'error'
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [id, push]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (!documentData) {
    return <Spinner />;
  }

  /*
   * ============================================================
   * FILE URL
   * ============================================================
   */

  const fileUrl = documentData.fileUrl?.startsWith('http')
    ? documentData.fileUrl
    : `${api.baseUrl}${documentData.fileUrl}`;

  const fileType = getFileType(
    documentData.mimeType || ''
  );

  /*
   * ============================================================
   * PERMISSIONS
   * ============================================================
   */

  const isOwner =
    documentData.uploadedById === user?.id;

  const isAdmin =
    user?.role?.name === 'Admin';

  const isSuperAdmin =
    user?.isSuperAdmin === true;

  /*
   * OWNER CAN EDIT ONLY IF HE HAS PERMISSION.
   *
   * ADMIN / SUPER ADMIN CAN MANAGE.
   */

  const canEdit =
    isSuperAdmin ||
    isAdmin ||
    (
      isOwner &&
      user?.permissions?.includes('document.update')
    );

  const canDelete =
    isSuperAdmin ||
    isAdmin ||
    (
      isOwner &&
      user?.permissions?.includes('document.delete')
    );

  /*
   * DOWNLOAD IS CONTROLLED BY PERMISSION.
   */

  const canDownload =
    isSuperAdmin ||
    user?.permissions?.includes('document.download');

  /*
   * ============================================================
   * DOWNLOAD
   * ============================================================
   *
   * IMPORTANT:
   * We use window.document.createElement()
   * because "document" is also the name of our data variable.
   */

  async function download() {
    if (!canDownload) {
      push(
        'You do not have permission to download this file.',
        'error'
      );
      return;
    }

    if (downloading) {
      return;
    }

    setDownloading(true);

    try {
      const token = localStorage.getItem(
        'tripleE_token'
      );

      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(fileUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        let message = `Download failed (${response.status})`;

        try {
          const data = await response.json();

          if (data?.message) {
            message = data.message;
          }
        } catch {
          // Response was not JSON.
        }

        throw new Error(message);
      }

      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error(
          'The downloaded file is empty.'
        );
      }

      /*
       * Create temporary object URL.
       */

      const blobUrl =
        window.URL.createObjectURL(blob);

      /*
       * IMPORTANT:
       * Use window.document.createElement()
       * NOT document.createElement()
       */

      const downloadLink =
        window.document.createElement('a');

      downloadLink.href = blobUrl;

      /*
       * Use original file name.
       */

      downloadLink.download =
        documentData.name || 'document';

      /*
       * Make it invisible.
       */

      downloadLink.style.display = 'none';

      window.document.body.appendChild(
        downloadLink
      );

      /*
       * Trigger browser download.
       */

      downloadLink.click();

      /*
       * Remove temporary element.
       */

      window.document.body.removeChild(
        downloadLink
      );

      /*
       * Release memory.
       *
       * Delay slightly so browsers don't cancel
       * the download before it starts.
       */

      window.setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      push('Download started.');
    } catch (error) {
      console.error(
        'Download error:',
        error
      );

      push(
        error.message ||
          'Unable to download the file. Please try again.',
        'error'
      );
    } finally {
      setDownloading(false);
    }
  }

  /*
   * ============================================================
   * SAVE DOCUMENT
   * ============================================================
   */

  async function saveChanges(event) {
    event.preventDefault();

    if (!canEdit) {
      push(
        'You do not have permission to edit this document.',
        'error'
      );
      return;
    }

    const cleanName = form.name.trim();

    if (!cleanName) {
      push(
        'Document name is required.',
        'error'
      );
      return;
    }

    setSaving(true);

    try {
      const updated =
        await api.updateDocument(id, {
          name: cleanName,
          description:
            form.description.trim(),
          accessLevel:
            form.accessLevel,
        });

      /*
       * Backend may return updated document.
       */

      if (updated) {
        setDocumentData(updated);

        setForm({
          name: updated.name || '',
          description:
            updated.description || '',
          accessLevel:
            updated.accessLevel || 'PRIVATE',
        });
      } else {
        /*
         * Fallback if backend returns no data.
         */

        setDocumentData((previous) => ({
          ...previous,
          name: cleanName,
          description:
            form.description.trim(),
          accessLevel:
            form.accessLevel,
        }));
      }

      setEditing(false);

      push('Document updated.');
    } catch (error) {
      push(
        error.message ||
          'Failed to update document.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================================================
   * DELETE DOCUMENT
   * ============================================================
   */

  async function del() {
    if (!canDelete) {
      push(
        'You do not have permission to delete this file.',
        'error'
      );
      return;
    }

    const confirmed =
      window.confirm(
        'Delete this document permanently?'
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await api.deleteDocument(id);

      push('Document deleted.');

      navigate('/documents');
    } catch (error) {
      push(
        error.message ||
          'Failed to delete document.',
        'error'
      );

      setDeleting(false);
    }
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <>
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
        }

        .preview-panel,
        .info-card,
        .edit-card {
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
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg, #f9fafb);
          padding: 16px;
          overflow: hidden;
        }

        .preview-image {
          display: block;
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
          flex-wrap: wrap;
        }

        .download-button {
          flex: 1;
          min-width: 150px;
          padding: 10px 14px;
          border-radius: 8px;
          border: none;
          background: var(--color-primary, #0f766e);
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .download-button:hover {
          opacity: .92;
        }

        .download-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .delete-button {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          background: #fee2e2;
          color: #b91c1c;
          font-weight: 600;
          cursor: pointer;
        }

        .delete-button:hover {
          background: #fecaca;
        }

        .delete-button:disabled {
          cursor: not-allowed;
          opacity: .7;
        }

        .edit-button {
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid #dbeafe;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 600;
          cursor: pointer;
        }

        .edit-button:hover {
          background: #dbeafe;
        }

        .info-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .info-card {
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

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 13px;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          color: #6b7280;
          flex-shrink: 0;
        }

        .detail-value {
          font-weight: 500;
          text-align: right;
          max-width: 65%;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        .edit-card {
          padding: 18px;
          margin-bottom: 16px;
        }

        .edit-form {
          display: grid;
          gap: 12px;
        }

        .edit-form input,
        .edit-form textarea,
        .edit-form select {
          width: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font: inherit;
          background: #fff;
        }

        .edit-form textarea {
          resize: vertical;
        }

        .edit-form input:focus,
        .edit-form textarea:focus,
        .edit-form select:focus {
          outline: none;
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, .1);
        }

        .edit-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .save-button {
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          background: #0f766e;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }

        .save-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .cancel-button {
          padding: 10px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
        }

        @media (max-width: 800px) {
          .document-content {
            grid-template-columns: 1fr;
          }
        }

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

          .preview-area {
            min-height: 250px;
            padding: 12px;
          }

          .preview-image {
            max-height: 420px;
          }

          .preview-pdf {
            height: 450px;
          }

          .preview-video {
            max-height: 420px;
          }

          .detail-row {
            gap: 10px;
          }

          .detail-value {
            max-width: 58%;
          }
        }

        @media (max-width: 380px) {
          .document-details-page {
            padding-left: 10px;
            padding-right: 10px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .download-button,
          .delete-button,
          .edit-button {
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

          .edit-actions {
            flex-direction: column;
          }

          .save-button,
          .cancel-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="document-details-page">

        {/* ======================================================
            BACK
            ====================================================== */}

        <Link
          to={
            documentData.folderId
              ? `/documents?folder=${encodeURIComponent(
                  documentData.folderId
                )}`
              : '/documents'
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 20,
            color: '#64748b',
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          ← Back
        </Link>

        {/* ======================================================
            HEADER
            ====================================================== */}

        <div className="document-header">

          <div style={{ minWidth: 0 }}>

            <h1 className="document-title">
              {documentData.name}
            </h1>

            <div className="document-subtitle">
              {documentData.category?.name ||
                'Uncategorized'}

              {' · '}

              {documentData.folder?.name ||
                'Root'}

              {' · '}

              {formatSize(
                documentData.sizeBytes
              )}
            </div>

          </div>

          <span
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background:
                documentData.accessLevel ===
                'PUBLIC'
                  ? '#d1fae5'
                  : '#ccfbf1',
              color:
                documentData.accessLevel ===
                'PUBLIC'
                  ? '#065f46'
                  : '#0f766e',
              flexShrink: 0,
            }}
          >
            {documentData.accessLevel}
          </span>

        </div>

        {/* ======================================================
            EDIT
            ====================================================== */}

        {editing && canEdit && (

          <section className="edit-card">

            <h3 style={{ marginTop: 0 }}>
              Edit document
            </h3>

            <form
              className="edit-form"
              onSubmit={saveChanges}
            >

              <input
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
                placeholder="Document name"
              />

              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                placeholder="Description"
              />

              <select
                value={form.accessLevel}
                onChange={(event) =>
                  setForm({
                    ...form,
                    accessLevel:
                      event.target.value,
                  })
                }
              >

                <option value="PUBLIC">
                  PUBLIC
                </option>

                <option value="RESTRICTED">
                  RESTRICTED
                </option>

                <option value="PRIVATE">
                  PRIVATE
                </option>

              </select>

              <div className="edit-actions">

                <button
                  type="submit"
                  disabled={saving}
                  className="save-button"
                >
                  {saving
                    ? 'Saving...'
                    : 'Save changes'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEditing(false)
                  }
                  className="cancel-button"
                >
                  Cancel
                </button>

              </div>

            </form>

          </section>

        )}

        {/* ======================================================
            MAIN CONTENT
            ====================================================== */}

        <div className="document-content">

          {/* ====================================================
              PREVIEW
              ==================================================== */}

          <div className="preview-panel">

            <div className="preview-title">
              Preview
            </div>

            <div className="preview-area">

              {/* IMAGE */}

              {fileType === 'image' && (

                <img
                  src={fileUrl}
                  alt={documentData.name}
                  className="preview-image"
                  onError={(event) => {
                    event.currentTarget.style.display =
                      'none';
                  }}
                />

              )}

              {/* PDF */}

              {fileType === 'pdf' && (

                <iframe
                  src={fileUrl}
                  title={documentData.name}
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

                  <div>
                    Preview not available for
                    this file type.
                  </div>

                  <div className="preview-empty-type">
                    {documentData.mimeType}
                  </div>

                </div>

              )}

            </div>

            {/* ==================================================
                ACTIONS
                ================================================== */}

            <div className="action-buttons">

              {canDownload && (

                <button
                  type="button"
                  onClick={download}
                  disabled={downloading}
                  className="download-button"
                >
                  {downloading
                    ? 'Downloading...'
                    : '⬇ Download'}
                </button>

              )}

              {canEdit && (

                <button
                  type="button"
                  className="edit-button"
                  onClick={() =>
                    setEditing((value) => !value)
                  }
                >
                  {editing
                    ? 'Close edit'
                    : 'Edit'}
                </button>

              )}

              {canDelete && (

                <button
                  type="button"
                  onClick={del}
                  disabled={deleting}
                  className="delete-button"
                >
                  {deleting
                    ? 'Deleting...'
                    : 'Delete'}
                </button>

              )}

            </div>

          </div>

          {/* ====================================================
              INFORMATION
              ==================================================== */}

          <div className="info-panel">

            {/* DESCRIPTION */}

            <div className="info-card">

              <div className="info-label">
                DESCRIPTION
              </div>

              <p className="description-text">
                {documentData.description ||
                  'No description provided.'}
              </p>

            </div>

            {/* FILE DETAILS */}

            <div className="info-card">

              <div
                className="info-label"
                style={{
                  marginBottom: 12,
                }}
              >
                FILE DETAILS
              </div>

              {[
                {
                  label: 'Uploaded by',
                  value:
                    documentData.uploadedBy
                      ?.fullName || '—',
                },

                {
                  label: 'Date',
                  value: formatDate(
                    documentData.createdAt
                  ),
                },

                {
                  label: 'Size',
                  value: formatSize(
                    documentData.sizeBytes
                  ),
                },

                {
                  label: 'Type',
                  value:
                    documentData.mimeType ||
                    '—',
                },

                {
                  label: 'Category',
                  value:
                    documentData.category
                      ?.name || '—',
                },

                {
                  label: 'Folder',
                  value:
                    documentData.folder
                      ?.name || 'Root',
                },

                {
                  label: 'Access',
                  value:
                    documentData.accessLevel ||
                    '—',
                },

              ].map(
                ({
                  label,
                  value,
                }) => (

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

                )
              )}

            </div>

          </div>

        </div>

      </div>
    </>
  );
}