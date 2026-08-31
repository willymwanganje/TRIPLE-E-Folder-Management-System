import { useEffect, useMemo, useState } from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import './DocumentsPage.css';

function getFileType(document) {
  const mime = document.mimeType || '';

  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('image')) return 'IMG';
  if (
    mime.includes('word') ||
    mime.includes('document')
  ) {
    return 'DOC';
  }

  if (
    mime.includes('sheet') ||
    mime.includes('excel')
  ) {
    return 'XLS';
  }

  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint')
  ) {
    return 'PPT';
  }

  return 'FILE';
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const { push } = useToast();

  const [searchParams] = useSearchParams();

  const folderId = searchParams.get('folder');

  const [docs, setDocs] = useState(null);
  const [folders, setFolders] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] =
    useState(false);

  const canUpload =
    user?.isSuperAdmin ||
    user?.permissions?.includes('document.create');

  async function loadDocuments(
    searchValue = ''
  ) {
    setIsLoading(true);

    try {
      const endpoint = searchValue.trim()
        ? `?search=${encodeURIComponent(
            searchValue.trim()
          )}`
        : '';

      const data = await api.documents(endpoint);

      setDocs(Array.isArray(data) ? data : []);
    } catch (error) {
      push(error.message, 'error');
      setDocs([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFolders() {
    try {
      const data = await api.folders();

      setFolders(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      push(error.message, 'error');
    }
  }

  useEffect(() => {
    loadDocuments();
    loadFolders();
  }, []);

  const currentFolder = folders.find(
    (folder) => folder.id === folderId
  );

  const visibleDocs = useMemo(() => {
    if (!docs) return [];

    if (!folderId) {
      return docs;
    }

    return docs.filter(
      (document) =>
        document.folderId === folderId ||
        document.folder?.id === folderId
    );
  }, [docs, folderId]);

  const submitSearch = (event) => {
    event.preventDefault();
    loadDocuments(query);
  };

  const clearSearch = () => {
    setQuery('');
    loadDocuments('');
  };

  if (!docs) {
    return (
      <div className="docs2-loading">
        <div className="docs2-loading-dot" />
        <span>Loading documents...</span>
      </div>
    );
  }

  return (
    <main className="docs2-page">
      <div className="docs2-wrapper">
        {/* Header */}
        <header className="docs2-header">
          <div>
            {folderId && (
              <Link
                to="/folders"
                style={{
                  display: 'inline-block',
                  marginBottom: 10,
                  color: '#64748b',
                  textDecoration: 'none',
                  fontSize: 13,
                }}
              >
                ← Folders
              </Link>
            )}

            <div className="docs2-kicker">
              {currentFolder
                ? currentFolder.category?.name ||
                  'Folder'
                : 'Workspace library'}
            </div>

            <h1 className="docs2-title">
              {currentFolder
                ? currentFolder.name
                : 'Documents'}
            </h1>

            <p className="docs2-subtitle">
              {currentFolder
                ? 'Files inside this folder.'
                : 'View only the files your account is allowed to access.'}
            </p>
          </div>

          {canUpload && (
            <Link
              to="/upload"
              className="docs2-upload"
            >
              <span className="docs2-upload-plus">
                +
              </span>
              Upload document
            </Link>
          )}
        </header>

        {/* Search */}
        <section className="docs2-toolbar">
          <form
            className="docs2-search"
            onSubmit={submitSearch}
          >
            <span className="docs2-search-symbol">
              ⌕
            </span>

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search by document name or description..."
              aria-label="Search documents"
            />

            {query && (
              <button
                type="button"
                className="docs2-clear"
                onClick={clearSearch}
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              className="docs2-search-button"
            >
              Search
            </button>
          </form>

          <div className="docs2-count">
            <strong>
              {visibleDocs.length}
            </strong>{' '}
            {visibleDocs.length === 1
              ? 'document'
              : 'documents'}

            {isLoading && (
              <span className="docs2-updating">
                Updating...
              </span>
            )}
          </div>
        </section>

        {/* Documents */}
        {visibleDocs.length === 0 ? (
          <section className="docs2-empty">
            <div className="docs2-empty-mark">
              —
            </div>

            <h2>No documents found</h2>

            <p>
              {folderId
                ? 'This folder does not contain any visible files.'
                : 'Try a different search or upload a new document.'}
            </p>

            {canUpload && (
              <Link
                to="/upload"
                className="docs2-empty-link"
              >
                Upload a document
              </Link>
            )}
          </section>
        ) : (
          <section className="docs2-grid">
            {visibleDocs.map((document) => {
              const sizeInMb =
                Number(
                  document.sizeBytes || 0
                ) /
                1024 /
                1024;

              const access =
                document.accessLevel ||
                'PRIVATE';

              const isPublic =
                access === 'PUBLIC';

              return (
                <article
                  className="docs2-card"
                  key={document.id}
                >
                  <div className="docs2-card-heading">
                    <div className="docs2-file-mark">
                      {getFileType(document)}
                    </div>

                    <span className="docs2-category-label">
                      {document.category?.name ||
                        'Uncategorized'}
                    </span>
                  </div>

                  <h2
                    className="docs2-name"
                    title={document.name}
                  >
                    {document.name}
                  </h2>

                  <p className="docs2-description">
                    {document.description ||
                      'No description provided'}
                  </p>

                  <div className="docs2-meta">
                    <span>
                      {sizeInMb.toFixed(2)} MB
                    </span>

                    <span>·</span>

                    <span>
                      {document.mimeType ||
                        'Unknown type'}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      marginTop: 8,
                    }}
                  >
                    {document.folder?.name ||
                      'Root'}
                  </div>

                  <div className="docs2-card-footer">
                    <span
                      className={`docs2-badge ${
                        isPublic
                          ? 'docs2-public'
                          : 'docs2-private'
                      }`}
                    >
                      <span className="docs2-badge-dot" />
                      {access}
                    </span>

                    <Link
                      to={`/documents/${document.id}`}
                      className="docs2-open"
                    >
                      Open{' '}
                      <span aria-hidden="true">
                        ↗
                      </span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}