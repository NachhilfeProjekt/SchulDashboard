// frontend/src/App.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';

// Importiere alle vorhandenen Seiten
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import LocationManagementPage from './pages/LocationManagementPage';
import ManageUsersPage from './pages/ManageUsersPage';
import EmailPage from './pages/EmailPage';
import ManageButtonsPage from './pages/ManageButtonsPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import UsersPage from './pages/UsersPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import CreateLeadPage from './pages/CreateLeadPage';

import { Box, Typography, Paper, Button } from '@mui/material';

// NotFound-Komponente
const NotFound = () => (
  <Box sx={{ p: 3, textAlign: 'center' }}>
    <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        404 - Seite nicht gefunden
      </Typography>
      <Typography paragraph>
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </Typography>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => window.location.href = '/dashboard'}
        sx={{ mt: 2 }}
      >
        Zurück zum Dashboard
      </Button>
    </Paper>
  </Box>
);

// Vollständiges Router-Setup mit allen vorhandenen Seiten
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/accept-invitation',
    element: <AcceptInvitationPage />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'locations',
        element: <LocationManagementPage />,
      },
      {
        path: 'manage-users',
        element: <ManageUsersPage />,
      },
      {
        path: 'email',
        element: <EmailPage />,
      },
      {
        path: 'manage-buttons',
        element: <ManageButtonsPage />,
      },
      {
        path: 'admin',
        element: <AdminPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'user-management',
        element: <UserManagementPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'create-lead',
        element: <CreateLeadPage />,
      },
      // Fallback-Route für alle nicht existierenden Pfade
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

function App() {
  return (
    <Provider store={store}>
      <div className="app">
        <RouterProvider router={router} />
      </div>
    </Provider>
  );
}

export default App;
