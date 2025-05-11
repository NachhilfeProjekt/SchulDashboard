import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { updateUser } from '../services/api';
import { 
  Box, Button, Typography, Paper, TextField, Avatar 
} from '@mui/material';

const SettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Die neuen Passwörter stimmen nicht überein.');
      return;
    }
    
    try {
      // TODO: Implement password change
      setSuccess('Passwort erfolgreich geändert.');
      setError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Fehler beim Ändern des Passworts. Bitte überprüfen Sie Ihr aktuelles Passwort.');
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
          <Typography variant="h6">{user.email}</Typography>
        </Box>
        
        <Typography variant="subtitle1">Rolle: {user.role}</Typography>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Passwort ändern
        </Typography>
        
        <TextField
          label="Aktuelles Passwort"
          type="password"
          fullWidth
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <TextField
          label="Neues Passwort"
          type="password"
          fullWidth
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <TextField
          label="Neues Passwort bestätigen"
          type="password"
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {success && (
          <Typography color="primary" sx={{ mb: 2 }}>
            {success}
          </Typography>
        )}
        
        <Button 
          variant="contained" 
          onClick={handlePasswordChange}
          disabled={!currentPassword || !newPassword || !confirmPassword}
        >
          Passwort ändern
        </Button>
      </Paper>
    </Box>
  );
};

export default SettingsPage;