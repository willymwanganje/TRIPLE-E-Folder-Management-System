import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import FileIcon from '../components/FileIcon';
import Spinner from '../components/Spinner';
import { useToast } from '../context/ToastContext';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="m7.5 8.5 4.5-4.5 4.5 4.5" />
      <path d="M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  const load = (search = q) => {
    setLoading(true);

    api.documents(search ? `?search=${encodeURIComponent(search)}` : '')
      .then(setDocs)
      .catch((error) => push(error.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load('');
    // The initial request should run only once when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    load(q.trim());
  };

  const clearSearch = () => {
    setQ('');
    load('');
  };

  if (!docs) return <Spinner />;

  return (
    <main className="documents-page">
      <section className="documents-container">
        <div className="documents-header">
          <div>
            <div className="eyebrow">Workspace library</div>
            <h1 className="documents-title">Documents</h1>
            <p className="documents-subtitle">
              View and manage the files your account is allowed to access.
            </p>
          </div>

          <Link to="/upload" className="documents-upload-button">
            <UploadIcon />
            <span>Upload document</span>
          </Link>
        </div>

        <div className="documents-toolbar">
          <form className="documents-search" onSubmit={handleSearchSubmit}>
            <SearchIcon />
            <input
              type="search"
              aria-label="Search documents"
              placeholder="Search by document name or description..."
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
            {q && (
              <button
                type="button"
                className="search-clear"
                aria-label="Clear search"
                onClick={clearSearch}
              >
                <CloseIcon />
              </button>
            )}
            <button type="submit" className="search-submit">
              Search
            </button>
          </form>

          <div className="documents-summary">
            <strong>{docs.length}</strong>
            {docs.length === 1 ? ' document' : ' documents'}
            {loading && <span className="loading-label">Updating...</span>}
          </div>
        </div>

        {docs.length === 0 ? (
          <div className="documents-empty-state">
            <div className="empty-icon"><SearchIcon /></div>
            <h2>No documents found</h2>
            <p>Try a different search term or upload a new document.</p>
            <Link to="/upload" className="empty-action">Upload a document</Link>
          </div>
        ) : (
          <div className="documents-grid">
            {docs.map((document) => {
              const category = document.category?.name || 'Uncategorized';
              const size = Number(document.sizeBytes || 0) / 1024 / 1024;
              const isPublic = document.accessLevel === 'PUBLIC';

              return (
                <article className="document-card" key={document.id}>
                  <div className="document-card-topline">
                    <div className="document-file-icon">
                      <FileIcon mime={document.mimeType} />
                    </div>
                    <span className="file-type-label">
                      {document.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                    </span>
                  </div>

                  <h2 className="document-name" title={document.name}>
                    {document.name}
                  </h2>

                  <p className="document-description">
                    {document.description || 'No description provided'}
                  </p>

                  <div className="document-meta">
                    <span>{category}</span>
                    <span className="meta-dot">·</span>
                    <span>{size.toFixed(2)} MB</span>
                  </div>

                  <div className="document-card-footer">
                    <span className={`access-badge ${isPublic ? 'is-public' : 'is-private'}`}>
                      <span className="badge-dot" />
                      {document.accessLevel || 'PRIVATE'}
                    </span>

                    <Link className="document-open-link" to={`/documents/${document.id}`}>
                      <span>Open</span>
                      <ArrowUpRightIcon />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}