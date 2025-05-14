// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import axios from 'axios';
import { Box, Button, Grid, Typography, Paper, CircularProgress, Link } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [customButtons, setCustomButtons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("DashboardPage wurde geladen");
    console.log("Aktueller Pfad:", location.pathname);
    console.log("User:", user);
    console.log("Standort:", currentLocation);
    
    if (user && currentLocation) {
      fetchCustomButtons();
    }
  }, [user, currentLocation, location.pathname]);

  const fetchCustomButtons = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('schul_dashboard_token');
      console.log("Token für Button-Anfrage:", token ? "Vorhanden" : "Nicht vorhanden");
      
      if (token) {
        try {
          console.log(`Sende Anfrage an: https://dashboard-backend-uweg.onrender.com/api/buttons/location/${currentLocation.id}`);
          const response = await axios.get(
            `https://dashboard-backend-uweg.onrender.com/api/buttons/location/${currentLocation.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          console.log("Button-API-Antwort:", response.data);
          
          if (response.data && Array.isArray(response.data)) {
            setCustomButtons(response.data);
          }
        } catch (error) {
          console.error('Fehler beim Abrufen der Buttons:', error);
        }
      }
      
      // Wenn keine Buttons gefunden wurden, füge Fallback hinzu
      if (customButtons.length === 0) {
        console.log("Keine Buttons gefunden, setze Fallback-Button");
        setCustomButtons([{
          id: 'fallback-button',
          name: 'Beispiel Button',
          url: 'https://example.com',
          location_id: currentLocation.id,
          created_by: 'system',
          created_at: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Fehler in fetchCustomButtons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = (path: string) => {
    console.log(`Button für Pfad ${path} wurde geklickt`);
    try {
      console.log(`Versuche Navigation zu ${path}`);
      navigate(path);
    } catch (error) {
      console.error(`Fehler bei Navigation zu ${path}:`, error);
      // Fallback zu direkter URL-Änderung
      console.log(`Fallback: Verwende window.location für ${path}`);
      window.location.href = path;
    }
  };

  if (!user || !currentLocation) {
    console.log("Dashboard kann nicht gerendert werden: Benutzer oder Standort fehlt");
    return null;
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
        Debug-Navigation
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <a href="/dashboard" style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              fullWidth
              sx={{ height: '100px' }}
            >
              Link: Dashboard
            </Button>
          </a>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <a href="/manage-users" style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              fullWidth
              sx={{ height: '100px' }}
            >
              Link: Mitarbeiter
            </Button>
          </a>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <a href="/email" style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              fullWidth
              sx={{ height: '100px' }}
            >
              Link: E-Mails
            </Button>
          </a>
        </Grid>
      </Grid>
      
      <Typography variant="h5" gutterBottom>
        System-Funktionen
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {user.role === 'developer' || user.role === 'lead' ? (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleButtonClick('/manage-users')}
              >
                Mitarbeiter verwalten
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleButtonClick('/email')}
              >
                E-Mails versenden
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleButtonClick('/manage-buttons')}
              >
                Buttons verwalten
              </Button>
            </Grid>
          </>
        ) : null}
        
        {user.role === 'developer' ? (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleButtonClick('/create-lead')}
              >
                Leitungsaccount erstellen
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                fullWidth
                sx={{ height: '100px' }}
                onClick={() => handleButtonClick('/admin')}
              >
                Admin
              </Button>
            </Grid>
          </>
        ) : null}
        
        <Grid item xs={12} sm={6} md={4}>
          <Button
            variant="contained"
            fullWidth
            sx={{ height: '100px' }}
            onClick={() => handleButtonClick('/settings')}
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
                <a href={button.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
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
        <Button 
          variant="outlined" 
          color="error" 
          onClick={() => {
            console.log("Abmelden-Button geklickt");
            localStorage.clear();
            window.location.href = '/login';
          }}
        >
          Abmelden (window.location)
        </Button>
      </Box>
    </Box>
  );
};

export default DashboardPage;
