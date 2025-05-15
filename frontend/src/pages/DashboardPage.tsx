// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { getButtonsForUser } from '../services/api';
import { Box, Button, Grid, Typography, Paper, CircularProgress, Alert } from '@mui/material';

const DashboardPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [customButtons, setCustomButtons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user && currentLocation) {
      console.log('Dashboard: User und Standort vorhanden', { user, currentLocation });
      fetchCustomButtons();
    }
  }, [user, currentLocation]);

  const fetchCustomButtons = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    setError('');
    try {
      const buttons = await getButtonsForUser(currentLocation.id);
      setCustomButtons(buttons);
    } catch (error) {
      console.error('Fehler beim Abrufen der Buttons:', error);
      setError('Fehler beim Laden der Buttons. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  // Handle navigation with React Router
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Loading-Anzeige
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Fehleranzeige
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => fetchCustomButtons()}>
          Erneut versuchen
        </Button>
      </Box>
    );
  }

  // Fallback, wenn kein Benutzer oder Standort verfügbar ist
  if (!user || !currentLocation) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>
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
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Willkommen, {user.email}
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          Aktueller Standort: {currentLocation.name}
        </Typography>
      </Paper>
      
      <Typography variant="h5" gutterBottom>
        System-Funktionen
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {(user.role === 'developer' || user.role === 'lead') && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleNavigation('/manage-users')}
              >
                Mitarbeiter verwalten
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleNavigation('/email')}
              >
                E-Mails versenden
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleNavigation('/manage-buttons')}
              >
                Buttons verwalten
              </Button>
            </Grid>
          </>
        )}
        
        {user.role === 'developer' && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleNavigation('/create-lead')}
              >
                Leitungsaccount erstellen
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleNavigation('/admin')}
              >
                Admin
              </Button>
            </Grid>
          </>
        )}
        
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="contained"
            fullWidth
            sx={{ height: '100px' }}
            onClick={() => handleNavigation('/settings')}
          >
            Einstellungen
          </Button>
        </Grid>
      </Grid>
      
      {customButtons.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom>
            Benutzerdefinierte Links
          </Typography>
          
          <Grid container spacing={3}>
            {customButtons.map((button) => (
              <Grid item xs={12} sm={6} md={4} key={button.id}>
                <a href={button.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{ height: '100px' }}
                  >
                    {button.name}
                  </Button>
                </a>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DashboardPage;
