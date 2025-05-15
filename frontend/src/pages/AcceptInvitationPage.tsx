import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { acceptLocationInvitation } from '../services/api';
import { 
  Box, 
  Button, 
  Container, 
  TextField, 
  Typography, 
  Paper, 
  Avatar,
  CircularProgress,
  Alert
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Ungültiger Einladungslink. Bitte fordern Sie eine neue Einladung an.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    
    if (!token) {
      setError('Ungültiger Token.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await acceptLocationInvitation(token, password);
      setSuccess(true);
    } catch (err: any) {
      console.error('Fehler beim Annehmen der Einladung:', err);
      setError(err.response?.data?.message || 'Fehler beim Annehmen der Einladung. Der Link ist möglicherweise abgelaufen.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          <Avatar sx={{ m: 1, bgcolor: 'success.main' }}>
            <PersonAddIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Einladung erfolgreich angenommen
          </Typography>
          <Typography sx={{ mt: 2, mb: 4, textAlign: 'center' }}>
            Ihr Konto wurde erfolgreich erstellt bzw. der Standort hinzugefügt. Sie können sich jetzt mit Ihrer E-Mail-Adresse und Ihrem Passwort anmelden.
          </Typography>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            onClick={() => navigate('/login')}
          >
            Zur Anmeldung
          </Button>
        </Box>
      </Container>
    );
  }

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
          <PersonAddIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Einladung annehmen
        </Typography>
        
        {!token ? (
          <Alert severity="error" sx={{ mt: 3, width: '100%' }}>
            Ungültiger Einladungslink. Bitte fordern Sie eine neue Einladung an.
          </Alert>
        ) : (
          <Paper elevation={3} sx={{ p: 3, mt: 2, width: '100%' }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Bitte legen Sie Ihr Passwort fest, um die Einladung anzunehmen.
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Passwort"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                helperText="Mindestens 8 Zeichen"
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Passwort bestätigen"
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? <CircularProgress size={24} /> : 'Einladung annehmen'}
              </Button>
              
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/login')}
              >
                Zurück zur Anmeldung
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default AcceptInvitationPage;
