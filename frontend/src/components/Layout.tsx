// frontend/src/components/Layout.tsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { Box, CssBaseline, Toolbar, CircularProgress, Typography, Button, Alert, Snackbar } from '@mui/material';
import { getCurrentUser, getUserLocations } from '../services/api';
import { updateUser, setCurrentLocation } from '../store/authSlice';

const Layout = () => {
  const { user, token, currentLocation, locations = [] } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(0);
  const [offlineMode, setOfflineMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  // Prüfen, ob die Session abgelaufen ist (über URL-Parameter)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('session_expired') === 'true') {
      setSessionExpired(true);
    }
  }, [location]);
  
  // Überprüfen, ob der Benutzer authentifiziert ist
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (!user || !currentLocation) {
      // Vermeide eine Endlosschleife, indem wir nach zu vielen Versuchen abbrechen
      if (loadingAttempts >= 3) {
        setOfflineMode(true);
        setLoading(false);
        setError('Verbindung zum Server konnte nicht hergestellt werden.');
        
        // Erstelle einen Dummy-Standort, wenn keiner existiert
        if (!currentLocation) {
          const dummyLocation = {
            id: 'default-location',
            name: 'Hauptstandort (Offline)',
            address: 'Offline-Modus - Keine Verbindung zum Server',
            isActive: true
          };
          dispatch(setCurrentLocation(dummyLocation));
        }
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Benutzerinformationen laden, wenn Token vorhanden aber User nicht
      const loadUserData = async () => {
        try {
          // Benutzerdaten laden, wenn nicht vorhanden
          if (!user) {
            const userData = await getCurrentUser();
            dispatch(updateUser(userData));
          }
          
          // Standortdaten laden, wenn nicht vorhanden
          if (!currentLocation) {
            const locationsData = await getUserLocations();
            console.log('Geladene Standorte:', locationsData);
            
            if (locationsData && locationsData.length > 0) {
              dispatch(setCurrentLocation(locationsData[0]));
            } else {
              // Wenn keine Standorte gefunden wurden, zeigen wir eine Fehlermeldung an
              setError('Keine Standorte für Ihren Benutzer gefunden. Bitte kontaktieren Sie den Administrator.');
              // Dummy-Standort setzen
              const dummyLocation = {
                id: 'no-locations',
                name: 'Kein Standort verfügbar',
                address: 'Bitte Administrator kontaktieren',
                isActive: true
              };
              dispatch(setCurrentLocation(dummyLocation));
            }
          }
        } catch (error) {
          console.error('Fehler beim Laden der Benutzerdaten:', error);
          setLoadingAttempts(prev => prev + 1);
          setError('Fehler beim Laden der Benutzerdaten. Bitte versuchen Sie es später erneut.');
          
          // Fallback für Offline-Modus
          // Wenn wir Benutzerdaten im localStorage haben, aber keine Standorte laden können
          if (user && !currentLocation) {
            const dummyLocation = {
              id: 'default-location',
              name: 'Hauptstandort (Offline)',
              address: 'Offline-Modus - Keine Verbindung zum Server',
              isActive: true
            };
            dispatch(setCurrentLocation(dummyLocation));
          }
        } finally {
          setLoading(false);
        }
      };
      
      loadUserData();
    }
  }, [token, user, currentLocation, dispatch, navigate, loadingAttempts]);
  
  // Umleitung zur Login-Seite, wenn die Session abgelaufen ist
  useEffect(() => {
    if (sessionExpired) {
      navigate('/login', { replace: true });
    }
  }, [sessionExpired, navigate]);
  
  // Protokolliere aktuelle Zustände für Debug-Zwecke
  useEffect(() => {
    console.log('Layout gerendert. Aktueller Pfad:', location.pathname);
    console.log('User:', user);
    console.log('Current Location:', currentLocation);
  }, [location.pathname, user, currentLocation]);
  
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
  
  if (offlineMode) {
    return (
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <Header />
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar /> {/* Spacing für Abstand unter Header */}
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6">Offline-Modus</Typography>
            <Typography variant="body1">
              Es konnte keine Verbindung zum Server hergestellt werden. Die Anwendung läuft im eingeschränkten Offline-Modus.
            </Typography>
            <Button
              variant="outlined"
              color="warning"
              sx={{ mt: 1 }}
              onClick={() => window.location.reload()}
            >
              Erneut versuchen
            </Button>
          </Alert>
          <Outlet /> {/* Hier werden die verschachtelten Routen gerendert */}
        </Box>
      </Box>
    );
  }
  
  if (!user || !currentLocation) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">
          Keine Benutzer- oder Standortdaten vorhanden. <a href="/login" onClick={(e) => {
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        <Outlet /> {/* Hier werden die verschachtelten Routen gerendert */}
      </Box>
      
      {/* Benachrichtigung über abgelaufene Session */}
      <Snackbar
        open={sessionExpired}
        autoHideDuration={6000}
        onClose={() => setSessionExpired(false)}
        message="Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an."
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Layout;
