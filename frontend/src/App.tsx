// frontend/src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './store/store';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmailPage from './pages/EmailPage';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageButtonsPage from './pages/ManageButtonsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import CreateLeadPage from './pages/CreateLeadPage';
import PrivateRoute from './components/PrivateRoute';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { initializeApp } from './utils/initializeApp';

// AppInitializer Komponente zum Initialisieren des App-Status
const AppInitializer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  useEffect(() => {
    console.log("App-Initialisierung wird ausgeführt...");
    initializeApp(dispatch);
  }, [dispatch]);
  
  return <Outlet />;
};

const App: React.FC = () => {
  console.log("App-Komponente wird gerendert...");
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        <Route element={<AppInitializer />}>
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/email" element={<EmailPage />} />
            <Route path="/manage-users" element={<ManageUsersPage />} />
            <Route path="/manage-buttons" element={<ManageButtonsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/create-lead" element={<CreateLeadPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
