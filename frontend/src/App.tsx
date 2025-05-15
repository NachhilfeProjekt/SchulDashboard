// frontend/src/App.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import LocationManagementPage from './pages/LocationManagementPage';
import { Box, Typography, Paper, Button } from '@mui/material';

// Inline NotFoundPage-Komponente anstatt eine separate Datei zu importieren
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

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
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
        // Fallback-Route für alle nicht existierenden Pfade
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
