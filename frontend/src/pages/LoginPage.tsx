// frontend/src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { login, testConnection, enableOfflineMode, isOfflineModeEnabled } from '../services/api';
import { loginSuccess } from '../store/authSlice';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Container, TextField, Typography, Paper, Avatar, 
  Alert, CircularProgress, Divider, List, ListItem, ListItemIcon, 
  ListItemText, Dialog, DialogTitle, DialogContent, DialogContentText, 
  DialogActions
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import PasswordResetDialog from '../components/PasswordResetDialog';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [offlineMode, setOfflineMode] = useState(isOfflineModeEnabled());
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Test der Verbindung beim Laden der Seite
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await testConnection();
        setConnectionStatus(isConnected ? 'success' : 'error');
        setOfflineMode(!isConnected);
      } catch (err) {
        setConnectionStatus('error');
        setOfflineMode(true);
      }
    };
    
    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await login(email, password);
      dispatch(loginSuccess({
        token: response.token,
        user: response.user,
        locations: response.locations || [],
      }));
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail und Passwort.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineMode = () => {
    enableOfflineMode();
    setOfflineMode(true);
    
    try {
      // Verwende direkt die Login-Funktion mit den Standard-Anmeldedaten
      const mockLogin = async () => {
        const response = await login('admin@example.com', 'admin123');
        dispatch(loginSuccess({
          token: response.token,
          user: response.user,
          locations: response.locations || [],
        }));
        navigate('/dashboard');
      };
      
      mockLogin();
    } catch (err) {
      setError('Fehler beim Aktivieren des Offline-Modus.');
    }
  };

  const handleConnectionTest = async () => {
    setLoading(true);
    setConnectionDialogOpen(true);
    
    try {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
      setOfflineMode(!isConnected);
    } catch (err) {
      setConnectionStatus('error');
      setOfflineMode(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
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
        
        {offlineMode && (
          <Alert severity="warning" sx={{ mt: 2, width: '100%' }}>
            <Typography variant="body2">
              Offline-Modus ist aktiv. Sie arbeiten mit eingeschränkter Funktionalität.
            </Typography>
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
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Anmelden
            </Button>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={handleOfflineMode}
                startIcon={<WifiOffIcon />}
                disabled={loading}
              >
                Offline-Modus
              </Button>
              
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={handleConnectionTest}
                disabled={loading}
              >
                Verbindungstest
              </Button>
            </Box>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="text"
                onClick={() => setResetDialogOpen(true)}
                disabled={loading}
              >
                Passwort vergessen?
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
      
      <Dialog open={connectionDialogOpen} onClose={() => setConnectionDialogOpen(false)}>
        <DialogTitle>Verbindungstest</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Prüfe Verbindung zum Backend-Server...
          </DialogContentText>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              <ListItem>
                <ListItemIcon>
                  {connectionStatus === 'success' ? (
                    <CheckCircleOutlineIcon color="success" />
                  ) : (
                    <ErrorOutlineIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={connectionStatus === 'success' ? 'Verbindung erfolgreich' : 'Verbindung fehlgeschlagen'} 
                  secondary={connectionStatus === 'success' 
                    ? 'Der Server ist erreichbar.' 
                    : 'Der Server konnte nicht erreicht werden. Der Offline-Modus wurde aktiviert.'}
                />
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectionDialogOpen(false)}>
            Schließen
          </Button>
          {connectionStatus === 'error' && (
            <Button onClick={handleOfflineMode} color="primary">
              Offline-Modus aktivieren
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      <PasswordResetDialog 
        open={resetDialogOpen} 
        onClose={() => setResetDialogOpen(false)} 
      />
    </Container>
  );
};

export default LoginPage;
