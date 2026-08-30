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

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="*" element={<Guard><div className="app-shell"><Sidebar /><main className="main-content"><Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/documents/:id" element={<DocumentDetailsPage />} />
      <Route path="/folders" element={<FoldersPage />} />
      <Route path="/upload" element={<UploadDocumentPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/users" element={<Guard permission="user.view"><UsersPage /></Guard>} />
      <Route path="/users/:id" element={<Guard permission="user.view"><UserDetailsPage /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></main></div></Guard>} />
  </Routes></BrowserRouter>;
}
