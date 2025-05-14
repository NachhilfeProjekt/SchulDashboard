import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import axios from 'axios';
import { Box, Button, Grid, Typography, Paper, CircularProgress } from '@mui/material';

// Einfache Komponentenversion ohne React Router-Abhängigkeiten
const DashboardPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [customButtons, setCustomButtons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && currentLocation) {
      console.log('Dashboard: User und Standort vorhanden', { user, currentLocation });
      fetchCustomButtons();
    }
  }, [user, currentLocation]);

  const fetchCustomButtons = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('schul_dashboard_token');
      
      if (token) {
        try {
          console.log('Button-Anfrage wird gesendet...');
          const response = await axios.get(
            `https://dashboard-backend-uweg.onrender.com/api/buttons/location/${currentLocation.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          console.log('Button-Antwort:', response.data);
          
          if (response.data && Array.isArray(response.data)) {
            setCustomButtons(response.data);
          }
        } catch (error) {
          console.error('Fehler beim Abrufen der Buttons:', error);
        }
      }
    } catch (error) {
      console.error('Fehler in fetchCustomButtons:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fallback, wenn kein Benutzer oder Standort verfügbar ist
  if (!user || !currentLocation) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Keine Benutzer- oder Standortdaten vorhanden. <a href="/login">Zurück zum Login</a></Typography>
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
              <a href="/manage-users" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ height: '100px' }}
                >
                  Mitarbeiter verwalten
                </Button>
              </a>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <a href="/email" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ height: '100px' }}
                >
                  E-Mails versenden
                </Button>
              </a>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <a href="/manage-buttons" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ height: '100px' }}
                >
                  Buttons verwalten
                </Button>
              </a>
            </Grid>
          </>
        )}
        
        {user.role === 'developer' && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <a href="/create-lead" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ height: '100px' }}
                >
                  Leitungsaccount erstellen
                </Button>
              </a>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <a href="/admin" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ height: '100px' }}
                >
                  Admin
                </Button>
              </a>
            </Grid>
          </>
        )}
        
        <Grid item xs={12} sm={6} md={4}>
          <a href="/settings" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
            <Button
              variant="contained"
              fullWidth
              sx={{ height: '100px' }}
            >
              Einstellungen
            </Button>
          </a>
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
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      <Box sx={{ mt: 4 }}>
        <a href="/login" style={{ textDecoration: 'none' }} onClick={(e) => {
          e.preventDefault();
          console.log('Abmelden...');
          localStorage.clear();
          window.location.href = '/login';
        }}>
          <Button 
            variant="outlined" 
            color="error"
          >
            Abmelden
          </Button>
        </a>
      </Box>
    </Box>
  );
};

export default DashboardPage;
