import React, { useState } from 'react';
import { requestPasswordReset } from '../services/api';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Typography } from '@mui/material';

interface PasswordResetDialogProps {
  open: boolean;
  onClose: () => void;
}

const PasswordResetDialog: React.FC<PasswordResetDialogProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    try {
      await requestPasswordReset(email);
      setMessage('Eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts wurde gesendet, falls die E-Mail registriert ist.');
      setError('');
    } catch (err) {
      setError('Fehler beim Anfordern des Passwort-Zurücksetzens.');
      setMessage('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Passwort zurücksetzen</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="email"
          label="E-Mail Adresse"
          type="email"
          fullWidth
          variant="standard"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        {message && (
          <Typography color="primary" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
        
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button onClick={handleSubmit}>Absenden</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PasswordResetDialog;