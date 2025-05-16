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
      if (loadingAttempts >= 2) { // Von 3 auf 2 reduziert für schnellere Offline-Erkennung
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
        
        // Falls wir einen Token haben, aber keinen Benutzer laden können,
        // erstellen wir einen Dummy-Benutzer für den Offline-Modus
        if (!user) {
          const dummyUser = {
            id: 'offline-user',
            email: 'offline@example.com',
            role: 'developer', // Gewähre volle Rechte im Offline-Modus
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          dispatch(updateUser(dummyUser));
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
  
  // Überprüfe, ob wir automatisch in den Offline-Modus wechseln sollten
  useEffect(() => {
    // Nach 5 Sekunden im Ladebildschirm automatisch den Offline-Modus anbieten
    let timeoutId: NodeJS.Timeout;
    
    if (loading && !offlineMode) {
      timeoutId = setTimeout(() => {
        if (loading) {
          setError('Verbindung zum Server dauert lange. Möchten Sie in den Offline-Modus wechseln?');
        }
      }, 5000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, offlineMode]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Laden...
        </Typography>
        {error && (
          <Box sx={{ mt: 4, maxWidth: 400, textAlign: 'center' }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setOfflineMode(true);
                setLoading(false);
                
                // Erst
