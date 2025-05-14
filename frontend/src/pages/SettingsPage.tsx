import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import axios from 'axios';
import { 
  Box, Button, Typography, Paper, TextField, Avatar, CircularProgress, Alert
} from '@mui/material';

const SettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // API-Endpunkt für Passwortänderung (Beispiel, muss implementiert werden)
      await axios.post('/api/users/change-password', {
        currentPassword,
        newPassword
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSuccess('Passwort erfolgreich geändert.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.message || 'Fehler beim Ändern des Passworts.');
      } else {
        setError('Fehler beim Ändern des Passworts. Bitte versuchen Sie es später erneut.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Einstellungen
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
            {user.email.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6">{user.email}</Typography>
            <Typography variant="subtitle1">
              Rolle: {
                user.role === 'developer' ? 'Entwickler' :
                user.role === 'lead' ? 'Leitung' :
                user.role === 'office' ? 'Büro' :
                'Lehrer'
              }
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Passwort ändern
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <TextField
          label="Aktuelles Passwort"
          type="password"
          fullWidth
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
        />
        
        <TextField
          label="Neues Passwort"
          type="password"
          fullWidth
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
          helperText="Mindestens 8 Zeichen"
        />
        
        <TextField
          label="Neues Passwort bestätigen"
          type="password"
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 2 }}
          disabled={loading}
        />
        
        <Button 
          variant="contained" 
          onClick={handlePasswordChange}
          disabled={!currentPassword || !newPassword || !confirmPassword || loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Passwort ändern
        </Button>
      </Paper>
    </Box>
  );
};

export default SettingsPage;
