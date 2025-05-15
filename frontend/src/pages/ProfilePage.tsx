// frontend/src/pages/ProfilePage.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const ProfilePage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Mein Profil</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Diese Funktion ist in Entwicklung.</Typography>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
