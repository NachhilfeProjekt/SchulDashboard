// frontend/src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Container, TextField, Typography, Paper, Avatar, 
  Alert, CircularProgress, Snackbar
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { attemptLogin, findWorkingBackendUrl } from '../services/auth';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [notification, setNotification] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Beim Laden der Seite Backend-Verbindung testen
  useEffect(() => {
    const checkBackendConnection = async () => {
      setConnecting(true);
      try {
        const baseUrl = await findWorkingBackendUrl();
        if (!baseUrl) {
          setOfflineMode(true);
          setNotification('Backend-Server nicht erreichbar. Offline-Modus verfügbar.');
        }
      } catch (err) {
        setOfflineMode(true);
        setNotification('Backend-Server nicht erreichbar. Offline-Modus verfügbar.');
      } finally {
        setConnecting(false);
      }
    };
    
    checkBackendConnection();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await attemptLogin(email, password, dispatch);
      
      if (result.success) {
        if (result.offlineMode) {
          setNotification('Offline-Modus aktiviert. Eingeschränkte Funktionalität verfügbar.');
        }
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineMode = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Verwende die Standard-Anmeldedaten für den Offline-Modus
      const result = await attemptLogin('admin@example.com', 'admin123', dispatch);
      
      if (result.success) {
        setNotification('Offline-Modus aktiviert. Eingeschränkte Funktionalität verfügbar.');
        navigate('/dashboard');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Fehler beim Aktivieren des Offline-Modus.');
    } finally {
      setLoading(false);
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
              Verbindung zum Server wird hergestellt...
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
                
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={handleOfflineMode}
                  disabled={loading}
                  startIcon={<WifiOffIcon />}
                  sx={{ mb: 1 }}
                >
                  Offline-Modus
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
