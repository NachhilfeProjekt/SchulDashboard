import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Header from './Header';
import Sidebar from './Sidebar';
import { Box, CssBaseline, Toolbar } from '@mui/material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {user && <Header />}
      {user && <Sidebar />}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {user && <Toolbar />}
        {children}
      </Box>
    </Box>
  );
};

export default Layout;