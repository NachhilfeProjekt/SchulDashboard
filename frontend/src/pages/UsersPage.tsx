// frontend/src/pages/UsersPage.tsx
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const UsersPage: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Benutzerverwaltung</Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Diese Funktion ist in Entwicklung.</Typography>
      </Paper>
    </Box>
  );
};

export default UsersPage;
