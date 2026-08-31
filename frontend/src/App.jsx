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
import CategoriesPage from './pages/CategoriesPage';
import UploadDocumentPage from './pages/UploadDocumentPage';
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';
import UserDetailsPage from './pages/UserDetailsPage';

function Guard({ children, permission }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    permission &&
    !user.isSuperAdmin &&
    !user.permissions?.includes(permission)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="app-shell"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
      }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="mobile-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar-wrapper ${
          sidebarOpen ? 'sidebar-open' : ''
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main */}
      <main
        className="main-content"
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Mobile header */}
        <div className="mobile-header">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Open menu"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <span
            style={{
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
            }}
          >
            TRIPLE-E
          </span>
        </div>

        <Routes>
          <Route path="/" element={<DashboardPage />} />

          {/* Documents */}
          <Route
            path="/documents"
            element={
              <Guard permission="document.view">
                <DocumentsPage />
              </Guard>
            }
          />

          <Route
            path="/documents/:id"
            element={
              <Guard permission="document.view">
                <DocumentDetailsPage />
              </Guard>
            }
          />

          {/* Categories */}
          <Route
            path="/categories"
            element={
              <Guard permission="category.view">
                <CategoriesPage />
              </Guard>
            }
          />

          {/* Folders */}
          <Route
            path="/folders"
            element={
              <Guard permission="folder.view">
                <FoldersPage />
              </Guard>
            }
          />

          {/* Upload */}
          <Route
            path="/upload"
            element={
              <Guard permission="document.create">
                <UploadDocumentPage />
              </Guard>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          {/* Users */}
          <Route
            path="/users"
            element={
              <Guard permission="user.view">
                <UsersPage />
              </Guard>
            }
          />

          <Route
            path="/users/:id"
            element={
              <Guard permission="user.view">
                <UserDetailsPage />
              </Guard>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>

      <style>{`
        .sidebar-wrapper {
          position: sticky;
          top: 0;
          height: 100vh;
          flex-shrink: 0;
        }

        .mobile-overlay {
          display: none;
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
            display: block;
          }

          .mobile-header {
            display: flex;
          }

          .main-content {
            width: 100%;
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
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="*"
          element={
            <Guard>
              <Layout />
            </Guard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}