// frontend/src/components/Layout.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { initializeApp } from '../utils/initializeApp';

const Layout = () => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Überprüfen, ob der Benutzer authentifiziert ist
  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else if (!user) {
      // Benutzerinformationen laden, wenn Token vorhanden aber User nicht
      initializeApp(dispatch);
    }
  }, [token, user, dispatch, navigate]);

  console.log('Layout gerendert. Aktueller Pfad:', location.pathname);
  console.log('User:', user);

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {user && <Header />}
      {user && <Sidebar />}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {user && <Toolbar />} {/* Spacing für Abstand unter Header */}
        <Outlet /> {/* Hier werden die verschachtelten Routen gerendert */}
      </Box>
    </Box>
  );
};

export default Layout;
