import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { Box, Button, Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();

  if (!user || !currentLocation) return null;

  const isDeveloper = user.role === 'developer';
  const isLead = user.role === 'lead';

  const buttons = [
    { name: 'Mitarbeiter anlegen', path: '/create-user', roles: ['developer', 'lead'] },
    { name: 'Mitarbeiter einladen', path: '/invite-user', roles: ['developer', 'lead'] },
    { name: 'E-Mails versenden', path: '/email', roles: ['developer', 'lead'] },
    { name: 'Rechte verwalten', path: '/manage-permissions', roles: ['developer', 'lead'] },
    { name: 'Leitungsaccount erstellen', path: '/create-lead', roles: ['developer'] },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Willkommen, {user.email}
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        Aktueller Standort: {currentLocation.name}
      </Typography>
      
      <Grid container spacing={2}>
        {buttons
          .filter(button => button.roles.includes(user.role))
          .map((button, index) => (
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
    </Box>
  );
};

export default DashboardPage;