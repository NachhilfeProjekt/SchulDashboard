import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { createUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Typography, Paper, TextField, FormControl, 
  InputLabel, Select, MenuItem, Chip, Checkbox, List, ListItem, 
  ListItemText 
} from '@mui/material';

const CreateLeadPage: React.FC = () => {
  const { user, locations } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const navigate = useNavigate();

  const handleCreateLead = async () => {
    try {
      await createUser(email, 'lead', selectedLocations);
      navigate('/manage-users');
    } catch (error) {
      console.error('Error creating lead:', error);
    }
  };

  const toggleLocation = (locationId: string) => {
    setSelectedLocations(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId) 
        : [...prev, locationId]
    );
  };

  if (user?.role !== 'developer') return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Leitungsaccount erstellen
      </Typography>
      
      <Paper sx={{ p: 3, maxWidth: 600 }}>
        <TextField
          label="E-Mail"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 3 }}
        />
        
        <Typography variant="h6" gutterBottom>
          Standorte auswählen
        </Typography>
        
        <List>
          {locations.map((location) => (
            <ListItem key={location.id}>
              <Checkbox
                checked={selectedLocations.includes(location.id)}
                onChange={() => toggleLocation(location.id)}
              />
              <ListItemText primary={location.name} />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button 
            variant="contained" 
            onClick={handleCreateLead}
            disabled={!email || selectedLocations.length === 0}
          >
            Leitungsaccount erstellen
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateLeadPage;