import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import axios from 'axios';
import { Box, Button, Grid, Typography, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [customButtons, setCustomButtons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && currentLocation) {
      console.log('Dashboard Page geladen mit User:', user);
      console.log('Aktueller Standort:', currentLocation);
      
      fetchCustomButtons();
      
      // Sicherheits-Fallback: Nach 5 Sekunden prüfen, ob Buttons geladen wurden
      const fallbackTimer = setTimeout(() => {
        if (customButtons.length === 0) {
          console.log('Keine Buttons nach Timeout - Zeige Fallback-Button');
          setCustomButtons([{
            id: 'timeout-fallback',
            name: 'Fallback Button (Timeout)',
            url: 'https://example.com',
            location_id: currentLocation.id,
            created_by: user.id,
            created_at: new Date().toISOString()
          }]);
        }
      }, 5000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [user, currentLocation]);

  const fetchCustomButtons = async () => {
    if (!currentLocation) {
      console.log('Kein Standort ausgewählt');
      return;
    }
    
    setLoading(true);
    console.log(`Versuche Buttons für Standort ${currentLocation.id} abzurufen`);
    
    // Token aus localStorage holen
    const token = localStorage.getItem('schul_dashboard_token');
    console.log('Token aus localStorage:', token ? 'Vorhanden' : 'Nicht vorhanden');
    
    if (!token) {
      console.log('Kein Token vorhanden - Zeige Fallback-Button');
      setCustomButtons([{
        id: 'no-token-fallback',
        name: 'Fallback Button (Kein Token)',
        url: 'https://example.com',
        location_id: currentLocation.id,
        created_by: 'system',
        created_at: new Date().toISOString()
      }]);
      setLoading(false);
      return;
    }
    
    try {
      // Direkte Axios-Anfrage statt API-Service
      const response = await axios.get(
        `https://dashboard-backend-uweg.onrender.com/api/buttons/location/${currentLocation.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Button-API-Antwort:', response.data);
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setCustomButtons(response.data);
      } else {
        console.log('Keine Buttons in API-Antwort - Erstelle lokalen Button');
        setCustomButtons([{
          id: 'empty-response-fallback',
          name: 'Fallback Button (Leere Antwort)',
          url: 'https://example.com',
          location_id: currentLocation.id,
          created_by: 'system',
          created_at: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Buttons:', error);
      
      // Fallback im Fehlerfall
      setCustomButtons([{
        id: 'error-fallback',
        name: 'Fallback Button (Fehler)',
        url: 'https://example.com',
        location_id: currentLocation.id,
        created_by: 'system',
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !currentLocation) return null;

  const isDeveloper = user.role === 'developer';
  const isLead = user.role === 'lead';

  const systemButtons = [
    { name: 'Mitarbeiter verwalten', path: '/manage-users', roles: ['developer', 'lead'] },
    { name: 'E-Mails versenden', path: '/email', roles: ['developer', 'lead'] },
    { name: 'Buttons verwalten', path: '/manage-buttons', roles: ['developer', 'lead'] },
    { name: 'Leitungsaccount erstellen', path: '/create-lead', roles: ['developer'] },
    { name: 'Admin', path: '/admin', roles: ['developer'] },
    { name: 'Einstellungen', path: '/settings', roles: ['developer', 'lead', 'office', 'teacher'] },
  ];

  const filteredSystemButtons = systemButtons.filter(button => 
    button.roles.includes(user.role)
  );

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
        {filteredSystemButtons.map((button, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Button
              variant="contained"
              fullWidth
              sx={{ height: '100px' }}
              onClick={() => navigate(button.path)}
            >
              {button.name}
            </Button>
          </Grid>
        ))}
      </Grid>
      
      <Typography variant="h5" gutterBottom>
        Benutzerdefinierte Links
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : customButtons.length > 0 ? (
        <Grid container spacing={3}>
          {customButtons.map((button) => (
            <Grid item xs={12} sm={6} md={4} key={button.id}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => window.open(button.url, '_blank')}
              >
                {button.name}
              </Button>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Keine benutzerdefinierten Links verfügbar</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default DashboardPage;
