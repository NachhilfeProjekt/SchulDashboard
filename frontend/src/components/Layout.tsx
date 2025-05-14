// frontend/src/components/Layout.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import Header from './Header';
import Sidebar from './Sidebar';
import { Box, CssBaseline, Toolbar, Typography, Button } from '@mui/material';

const Layout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log('Layout: Aktuelle Route:', location.pathname);
  }, [location]);

  // Test-Navigationsfunktion
  const handleTestNavigation = (path: string) => {
    console.log(`Versuche Navigation zu: ${path}`);
    try {
      navigate(path);
    } catch (error) {
      console.error(`Fehler bei der Navigation zu ${path}:`, error);
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {user && <Header />}
      {user && <Sidebar />}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {user && <Toolbar />} {/* Spacing to push content below AppBar */}
        
        {/* Debug-Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" display="block" gutterBottom>
            <strong>Debug-Info:</strong> Aktuelle Route: {location.pathname}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button 
              size="small" 
              variant="outlined" 
              sx={{ mr: 1 }} 
              onClick={() => handleTestNavigation('/dashboard')}
            >
              Test: Dashboard
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              sx={{ mr: 1 }} 
              onClick={() => handleTestNavigation('/manage-users')}
            >
              Test: Mitarbeiter
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              sx={{ mr: 1 }} 
              onClick={() => handleTestNavigation('/email')}
            >
              Test: E-Mail
            </Button>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => handleTestNavigation('/settings')}
            >
              Test: Einstellungen
            </Button>
          </Box>
        </Box>
        
        <Outlet /> {/* This allows for nested routes to render here */}
      </Box>
    </Box>
  );
};

export default Layout;
