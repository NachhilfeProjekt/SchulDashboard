// frontend/src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import { getButtonsForUser } from '../services/api';
import { Box, Button, Grid, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SettingsIcon from '@mui/icons-material/Settings';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const DashboardPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buttons, setButtons] = useState<any[]>([]);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Vermeiden von endlosen API-Anfragen
    if (fetchAttempts > 2) return;
    
    if (user && currentLocation) {
      console.log('Dashboard: User und Standort vorhanden', user);
      const loadButtons = async () => {
        setLoading(true);
        setError(null);
        try {
          const buttonsData = await getButtonsForUser();
          setButtons(buttonsData);
        } catch (err) {
          console.error('Fehler beim Abrufen der Buttons:', err);
          setError('Fehler beim Laden der Buttons. Offline-Modus ist aktiv.');
          setFetchAttempts(prev => prev + 1);
        } finally {
          setLoading(false);
        }
      };

      loadButtons();
    }
  }, [user, currentLocation, fetchAttempts]);

  const getIconByName = (iconName: string) => {
    switch (iconName) {
      case 'Dashboard':
        return <DashboardIcon fontSize="large" />;
      case 'People':
        return <PeopleIcon fontSize="large" />;
      case 'LocationOn':
        return <LocationOnIcon fontSize="large" />;
      case 'Settings':
        return <SettingsIcon fontSize="large" />;
      case 'School':
        return <SchoolIcon fontSize="large" />;
      case 'Assessment':
        return <AssessmentIcon fontSize="large" />;
      case 'Receipt':
        return <ReceiptIcon fontSize="large" />;
      case 'CalendarToday':
        return <CalendarTodayIcon fontSize="large" />;
      default:
        return <DashboardIcon fontSize="large" />;
    }
  };

  if (loading && fetchAttempts === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {error && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {buttons.map((button) => (
          <Grid item xs={12} sm={6} md={4} key={button.id}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 200,
                cursor: 'pointer',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                },
                borderTop: `4px solid ${button.color || '#2196f3'}`,
              }}
              onClick={() => navigate(button.route)}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 2,
                  color: button.color || '#2196f3',
                }}
              >
                {getIconByName(button.icon)}
                <Typography variant="h5" sx={{ ml: 1 }}>
                  {button.title}
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" sx={{ flex: 1 }}>
                {button.description}
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 2, color: button.color || '#2196f3', borderColor: button.color || '#2196f3' }}
                onClick={() => navigate(button.route)}
              >
                Öffnen
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardPage;
