import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import './DocumentsPage.css';

function getFileType(document) {
  const mime = document.mimeType || '';
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('image')) return 'IMG';
  if (mime.includes('word') || mime.includes('document')) return 'DOC';
  if (mime.includes('sheet') || mime.includes('excel')) return 'XLS';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'PPT';
  return 'FILE';
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { push } = useToast();

  const loadDocuments = (searchValue = '') => {
    setIsLoading(true);

    const endpoint = searchValue.trim()
      ? `?search=${encodeURIComponent(searchValue.trim())}`
      : '';

    api.documents(endpoint)
      .then(setDocs)
      .catch((error) => push(error.message, 'error'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDocuments();
    // Load documents once when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <header className="docs2-header">
          <div>
            <div className="docs2-kicker">Workspace library</div>
            <h1 className="docs2-title">Documents</h1>
            <p className="docs2-subtitle">
              View only the files your account is allowed to access.
            </p>
          </div>

          <Link to="/upload" className="docs2-upload">
            <span className="docs2-upload-plus">+</span>
            Upload document
          </Link>
        </header>

        <section className="docs2-toolbar">
          <form className="docs2-search" onSubmit={submitSearch}>
            <span className="docs2-search-symbol">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by document name or description..."
              aria-label="Search documents"
            />
            {query && (
              <button type="button" className="docs2-clear" onClick={clearSearch}>
                Clear
              </button>
            )}
            <button type="submit" className="docs2-search-button">Search</button>
          </form>

          <div className="docs2-count">
            <strong>{docs.length}</strong>{' '}
            {docs.length === 1 ? 'document' : 'documents'}
            {isLoading && <span className="docs2-updating">Updating...</span>}
          </div>
        </section>

        {docs.length === 0 ? (
          <section className="docs2-empty">
            <div className="docs2-empty-mark">—</div>
            <h2>No documents found</h2>
            <p>Try a different search or upload a new document.</p>
            <Link to="/upload" className="docs2-empty-link">Upload a document</Link>
          </section>
        ) : (
          <section className="docs2-grid">
            {docs.map((document) => {
              const sizeInMb = Number(document.sizeBytes || 0) / 1024 / 1024;
              const access = document.accessLevel || 'PRIVATE';
              const isPublic = access === 'PUBLIC';

              return (
                <article className="docs2-card" key={document.id}>
                  <div className="docs2-card-heading">
                    <div className="docs2-file-mark">{getFileType(document)}</div>
                    <span className="docs2-category-label">
                      {document.category?.name || 'Uncategorized'}
                    </span>
                  </div>

                  <h2 className="docs2-name" title={document.name}>
                    {document.name}
                  </h2>
                  <p className="docs2-description">
                    {document.description || 'No description provided'}
                  </p>

                  <div className="docs2-meta">
                    <span>{sizeInMb.toFixed(2)} MB</span>
                    <span>·</span>
                    <span>{document.mimeType || 'Unknown type'}</span>
                  </div>

                  <div className="docs2-card-footer">
                    <span className={`docs2-badge ${isPublic ? 'docs2-public' : 'docs2-private'}`}>
                      <span className="docs2-badge-dot" />
                      {access}
                    </span>
                    <Link to={`/documents/${document.id}`} className="docs2-open">
                      Open <span aria-hidden="true">↗</span>
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