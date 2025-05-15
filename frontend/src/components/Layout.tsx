// frontend/src/components/Layout.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Box, CssBaseline, Toolbar, CircularProgress, Typography } from '@mui/material';
import { getCurrentUser, getUserLocations } from '../services/api';
import { updateUser, setCurrentLocation } from '../store/authSlice';

const Layout = () => {
  const { user, token, currentLocation } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  // Überprüfen, ob der Benutzer authentifiziert ist
  useEffect(() => {
    console.log('Layout: Token vorhanden?', !!token);
    console.log('Layout: User vorhanden?', !!user);
    console.log('Layout: CurrentLocation vorhanden?', !!currentLocation);

    if (!token) {
      navigate('/login', { replace: true });
    } else if (!user || !currentLocation) {
      setLoading(true);
      // Benutzerinformationen laden, wenn Token vorhanden aber User nicht
      const loadUserData = async () => {
        try {
          // Benutzerdaten laden
          const userData = await getCurrentUser();
          dispatch(updateUser(userData));
          
          // Standortdaten laden
          const locationsData = await getUserLocations();
          console.log('Geladene Standorte:', locationsData);
          
          if (locationsData && locationsData.length > 0) {
            dispatch(setCurrentLocation(locationsData[0]));
          }
        } catch (error) {
          console.error('Fehler beim Laden der Benutzerdaten:', error);
          
          // Bei Fehler zum Login umleiten
          localStorage.removeItem('schul_dashboard_token');
          localStorage.removeItem('schul_dashboard_user');
          localStorage.removeItem('schul_dashboard_locations');
          localStorage.removeItem('schul_dashboard_current_location');
          navigate('/login', { replace: true });
        } finally {
          setLoading(false);
        }
      };
      
      loadUserData();
    }
  }, [token, user, currentLocation, dispatch, navigate]);

  console.log('Layout gerendert. Aktueller Pfad:', location.pathname);
  console.log('User:', user);
  console.log('Current Location:', currentLocation);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Laden...
        </Typography>
      </Box>
    );
  }

  if (!user || !currentLocation) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">
          Keine Benutzer- oder Standortdaten vorhanden. <a href="/" onClick={(e) => {
            e.preventDefault();
            localStorage.removeItem('schul_dashboard_token');
            localStorage.removeItem('schul_dashboard_user');
            localStorage.removeItem('schul_dashboard_locations');
            localStorage.removeItem('schul_dashboard_current_location');
            window.location.href = '/login';
          }}>Zurück zum Login</a>
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Spacing für Abstand unter Header */}
        <Outlet /> {/* Hier werden die verschachtelten Routen gerendert */}
      </Box>
    </Box>
  );
};

export default Layout;
