import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getButtonsForUser } from '../services/api';
import { Box, Button, Grid, Typography, Paper, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [customButtons, setCustomButtons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && currentLocation) {
      fetchCustomButtons();
    }
  }, [user, currentLocation]);

  // In frontend/src/pages/DashboardPage.tsx aktualisiere die fetchCustomButtons-Funktion
const fetchCustomButtons = async () => {
  if (!currentLocation) return;
  
  setLoading(true);
  try {
    console.log(`Versuche Buttons für Standort ${currentLocation.id} abzurufen`);
    const buttons = await getButtonsForUser(currentLocation.id);
    console.log(`Erhaltene Buttons:`, buttons);
    setCustomButtons(buttons);
    
    // Wenn keine Buttons zurückgegeben wurden, erzeuge einen lokalen Test-Button
    if (buttons.length === 0) {
      console.log('Keine Buttons erhalten, erstelle lokalen Test-Button');
      setCustomButtons([{
        id: 'local-fallback',
        name: 'Test Button (Fallback)',
        url: 'https://example.com',
        locationId: currentLocation.id,
        created_by: 'system',
        created_at: new Date().toISOString()
      }]);
    }
  } catch (error) {
    console.error('Error fetching custom buttons:', error);
    
    // Im Fehlerfall einen lokalen Test-Button anzeigen
    setCustomButtons([{
      id: 'error-fallback',
      name: 'Test Button (Fehler-Fallback)',
      url: 'https://example.com',
      locationId: currentLocation?.id || 'default',
      created_by: 'system',
      created_at: new Date().toISOString()
    }]);
  } finally {
    setLoading(false);
  }
};
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
      
      {customButtons.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom>
            Benutzerdefinierte Links
          </Typography>
          
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
        </>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default DashboardPage;
