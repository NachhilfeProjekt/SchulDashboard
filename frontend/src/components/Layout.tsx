// frontend/src/components/Layout.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { RootState } from '../store/store';
import Header from './Header';
import Sidebar from './Sidebar';
import { Box, CssBaseline, Toolbar, Typography } from '@mui/material';

const Layout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  
  useEffect(() => {
    console.log('Aktuelle Route:', location.pathname);
  }, [location]);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {user && <Header />}
      {user && <Sidebar />}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {user && <Toolbar />} {/* Spacing to push content below AppBar */}
        <Typography variant="caption" display="block" gutterBottom>
          Aktuelle Route: {location.pathname}
        </Typography>
        <Outlet /> {/* This allows for nested routes to render here */}
      </Box>
    </Box>
  );
};

export default Layout;
