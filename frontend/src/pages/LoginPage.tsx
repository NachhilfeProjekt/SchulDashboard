// frontend/src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Container, TextField, Typography, Paper, Avatar, 
  Alert, CircularProgress, Snackbar
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import axios from 'axios';
import { loginSuccess } from '../store/authSlice';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [notification, setNotification] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Bei Seitenladung prüfen, ob der Benutzer bereits angemeldet ist
  useEffect(() => {
    const token = localStorage.getItem('schul_dashboard_token');
    const user = JSON.parse(localStorage.getItem('schul_dashboard_user') || 'null');
    const locations = JSON.parse(localStorage.getItem('schul_dashboard_locations') || '[]');
    const currentLocation = JSON.parse(localStorage.getItem('schul_dashboard_current_location') || 'null');
    
    if (token && user && locations.length > 0 && currentLocation) {
      dispatch(loginSuccess({
        token,
        user,
        locations
      }));
      navigate('/dashboard');
    }
  }, [dispatch, navigate]);

  // Debug-Funktionalität
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    console.log('Debug-Modus:', !debugMode ? 'aktiviert' : 'deaktiviert');
    
    // Debug-Panel im DOM anzeigen/verstecken
    const debugPanel = document.getElementById('debug-panel');
    if (debugPanel) {
      debugPanel.style.display = !debugMode ? 'block' : 'none';
    } else {
      // Debug-Panel erstellen, wenn es nicht existiert
      const panel = document.createElement('div');
      panel.id = 'debug-panel';
      panel.style.position = 'fixed';
      panel.style.bottom = '10px';
      panel.style.right = '10px';
      panel.style.maxWidth = '80%';
      panel.style.maxHeight = '60%';
      panel.style.overflowY = 'auto';
      panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      panel.style.color = '#00ff00';
      panel.style.fontFamily = 'monospace';
      panel.style.padding = '10px';
      panel.style.borderRadius = '4px';
      panel.style.zIndex = '9999';
      
      const heading = document.createElement('h4');
      heading.textContent = 'Debug Log';
      
      const logArea = document.createElement('pre');
      logArea.id = 'debug-log';
      
      panel.appendChild(heading);
      panel.appendChild(logArea);
      document.body.appendChild(panel);
    }
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  try {
    console.log('Login-Versuch mit:', { email, password: '***' });
    
    // Direkter Login-Versuch mit voller URL
    const apiUrl = import.meta.env.VITE_API_URL || 'https://dashboard-backend-uweg.onrender.com/api';
    console.log('Verwende API-URL:', apiUrl);
    
    const response = await axios.post(`${apiUrl}/auth/login`, {
      email,
      password
    });
    
    console.log('Login erfolgreich:', response.data);
    
    // Token und Benutzerdaten im localStorage speichern
    localStorage.setItem('schul_dashboard_token', response.data.token);
    localStorage.setItem('schul_dashboard_user', JSON.stringify(response.data.user));
    localStorage.setItem('schul_dashboard_locations', JSON.stringify(response.data.locations || []));
    
    if (response.data.locations && response.data.locations.length > 0) {
      localStorage.setItem('schul_dashboard_current_location', JSON.stringify(response.data.locations[0]));
    }
    
    // Redux-Store aktualisieren
    dispatch(loginSuccess({
      token: response.data.token,
      user: response.data.user,
      locations: response.data.locations || []
    }));
    
    // Weiterleitung zum Dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('Login-Fehler:', error);
    
    if (axios.isAxiosError(error) && error.response) {
      setError(error.response.data.message || 'Anmeldung fehlgeschlagen.');
    } else if (axios.isAxiosError(error) && error.request) {
      setError('Keine Antwort vom Server. Überprüfen Sie Ihre Internetverbindung.');
      setOfflineMode(true);
    } else {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  } finally {
    setLoading(false);
  }
};

  const handleOfflineMode = () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Offline-Modus wird aktiviert...');
      
      // Standard-Benutzer für Offline-Modus
      const mockUser = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@example.com',
        role: 'developer',
        createdAt: new Date().toISOString()
      };
      
      const mockLocations = [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Hauptstandort',
          createdAt: new Date().toISOString()
        }
      ];
      
      const mockToken = 'offline-mock-token';
      
      // Daten im localStorage speichern
      localStorage.setItem('schul_dashboard_token', mockToken);
      localStorage.setItem('schul_dashboard_user', JSON.stringify(mockUser));
      localStorage.setItem('schul_dashboard_locations', JSON.stringify(mockLocations));
      localStorage.setItem('schul_dashboard_current_location', JSON.stringify(mockLocations[0]));
      
      // Redux-Store aktualisieren
      dispatch(loginSuccess({
        token: mockToken,
        user: mockUser,
        locations: mockLocations
      }));
      
      setNotification('Offline-Modus aktiviert. Eingeschränkte Funktionalität verfügbar.');
      
      // Weiterleitung zum Dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Fehler beim Aktivieren des Offline-Modus:', error);
      setError('Fehler beim Aktivieren des Offline-Modus.');
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setConnecting(true);
    try {
      // Teste einen allgemeinen API-Endpunkt statt /health
      const cacheBuster = `?cb=${Date.now()}`;
      const apiUrl = import.meta.env.VITE_API_URL || 'https://dashboard-backend-uweg.onrender.com/api';
      
      // Versuche die Login-URL als Test-Endpunkt
      const result = await axios.get(`${apiUrl}/auth/login${cacheBuster}`, { 
        timeout: 5000,
        validateStatus: function (status) {
          // Akzeptiere alle Status-Codes unter 500, auch 404 bedeutet, dass der Server erreichbar ist
          return status < 500;
        }
      });
      
      console.log('Backend-Verbindungstest:', result.status);
      setNotification(`Verbindung zum Backend erfolgreich (Status: ${result.status})`);
      setOfflineMode(false);
    } catch (error) {
      console.error('Backend-Verbindungstest fehlgeschlagen:', error);
      setNotification('Verbindung zum Backend nicht möglich. Offline-Modus wird empfohlen.');
      setOfflineMode(true);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification('')}
        message={notification}
      />
      
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Schul Dashboard
        </Typography>
        
        {connecting ? (
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }}>
              Verbindung zum Server wird getestet...
            </Typography>
          </Box>
        ) : (
          <>
            {offlineMode && (
              <Alert severity="warning" sx={{ mt: 2, width: '100%' }}>
                Server nicht erreichbar. Offline-Modus verfügbar mit Standard-Anmeldedaten.
              </Alert>
            )}
            
            <Paper elevation={3} sx={{ p: 3, mt: 2, width: '100%' }}>
              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="E-Mail Adresse"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Passwort"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Anmelden'}
                </Button>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleOfflineMode}
                    disabled={loading}
                    startIcon={<WifiOffIcon />}
                  >
                    Offline-Modus
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={toggleDebugMode}
                    disabled={loading}
                  >
                    {debugMode ? 'Debug aus' : 'Debug ein'}
                  </Button>
                </Box>
                
                <Button
                  fullWidth
                  variant="text"
                  onClick={testBackendConnection}
                  disabled={loading || connecting}
                  size="small"
                >
                  Backend-Verbindung testen
                </Button>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
};

export default LoginPage;
