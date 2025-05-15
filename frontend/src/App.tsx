// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmailPage from './pages/EmailPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageButtonsPage from './pages/ManageButtonsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import CreateLeadPage from './pages/CreateLeadPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UserManagementPage from './pages/UserManagementPage'; // Neuer Import

// Einfache Authentifizierungsprüfung
const isAuthenticated = () => {
  return localStorage.getItem('schul_dashboard_token') !== null;
};

// Einfache Private Route Komponente
const PrivateRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route path="/" element={<PrivateRoute element={<Layout />} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="email" element={<EmailPage />} />
          <Route path="manage-users" element={<ManageUsersPage />} />
          <Route path="manage-buttons" element={<ManageButtonsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="create-lead" element={<CreateLeadPage />} />
          <Route path="user-management" element={<UserManagementPage />} /> {/* Neue Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

// Hauptkomponente mit Redux Provider
const AppWithRedux = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

export default AppWithRedux;
