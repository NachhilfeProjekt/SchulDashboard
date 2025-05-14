import React from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { RootState } from '../store/store';
import Header from './Header';
import Sidebar from './Sidebar';
import { Box, CssBaseline, Toolbar } from '@mui/material';

const Layout: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

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
