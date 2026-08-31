import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Spinner from './components/Spinner';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailsPage from './pages/DocumentDetailsPage';
import FoldersPage from './pages/FoldersPage';
import UploadDocumentPage from './pages/UploadDocumentPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import UserDetailsPage from './pages/UserDetailsPage';

function Guard({ children, permission }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (permission && !user.isSuperAdmin && !user.permissions?.includes(permission)) return <Navigate to="/" replace />;
  return children;
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell" style={{ position: 'relative' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 40, display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Sidebar */}
      <div style={{
        transform: sidebarOpen ? 'translateX(0)' : undefined,
      }} className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="main-content">
        {/* Mobile header */}
        <div className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 8, borderRadius: 8, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>TRIPLE-E</span>
        </div>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/documents/:id" element={<DocumentDetailsPage />} />
          <Route path="/folders" element={<FoldersPage />} />
          <Route path="/upload" element={<UploadDocumentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users" element={<Guard permission="user.view"><UsersPage /></Guard>} />
          <Route path="/users/:id" element={<Guard permission="user.view"><UserDetailsPage /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <style>{`
        .sidebar-wrapper {
          position: sticky;
          top: 0;
          height: 100vh;
          flex-shrink: 0;
        }
        .mobile-header {
          display: none;
          align-items: center;
          gap: 12px;
          background: #0b1728;
          padding: 14px 16px;
          position: sticky;
          top: 0;
          z-index: 30;
        }
        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .sidebar-wrapper.sidebar-open {
            transform: translateX(0);
          }
          .mobile-overlay {
            display: block !important;
          }
          .mobile-header {
            display: flex !important;
          }
          .main-content {
            padding-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Guard><Layout /></Guard>} />
      </Routes>
    </BrowserRouter>
  );
}