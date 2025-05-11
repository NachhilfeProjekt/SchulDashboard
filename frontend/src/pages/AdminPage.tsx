import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getLocations, createLocation } from '../services/api';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const AdminPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [locations, setLocations] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: ''
  });

  useEffect(() => {
    if (user?.role === 'developer') {
      const fetchLocations = async () => {
        const data = await getLocations();
        setLocations(data);
      };
      fetchLocations();
    }
  }, [user]);

  const handleCreateLocation = async () => {
    try {
      await createLocation(newLocation.name);
      setOpenDialog(false);
      setNewLocation({ name: '' });
      
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error creating location:', error);
    }
  };

  if (user?.role !== 'developer') return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Standorte verwalten
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Neuen Standort erstellen
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>{location.name}</TableCell>
                  <TableCell align="right">
                    <Button 
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        if (window.confirm(`Möchten Sie den Standort "${location.name}" wirklich löschen?`)) {
                          // TODO: Implement location deletion
                        }
                      }}
                    >
                      Löschen
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neuen Standort erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={newLocation.name}
              onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
              sx={{ mb: 3 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateLocation}
            disabled={!newLocation.name}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;