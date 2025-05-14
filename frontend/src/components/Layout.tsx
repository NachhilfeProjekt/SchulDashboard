// frontend/src/components/Layout.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Box, CssBaseline, Toolbar, Typography } from '@mui/material';

const Layout = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  console.log('Layout gerendert. Aktueller Pfad:', location.pathname);
  console.log('User:', user);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {user && <Header />}
      {user && <Sidebar />}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {user && <Toolbar />} {/* Spacing to push content below AppBar */}
        <Outlet /> {/* This allows for nested routes to render here */}
      </Box>
    </Box>
  );
};

export default Layout;
