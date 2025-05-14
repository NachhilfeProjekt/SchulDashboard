import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getLocations, createLocation } from '../services/api';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Alert, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

const AdminPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [locations, setLocations] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newLocation, setNewLocation] = useState({
    name: ''
  });

  useEffect(() => {
    if (user?.role === 'developer') {
      fetchLocations();
    }
  }, [user]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Fehler beim Laden der Standorte.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await createLocation(newLocation.name);
      setOpenDialog(false);
      setNewLocation({ name: '' });
      setSuccess('Standort wurde erfolgreich erstellt.');
      
      await fetchLocations();
    } catch (error) {
      console.error('Error creating location:', error);
      setError('Fehler beim Erstellen des Standorts.');
    } finally {
      setLoading(false);
    }
  };

  // Nur Developer können diese Seite sehen
  if (user?.role !== 'developer') return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Standorte verwalten
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          disabled={loading}
        >
          Neuen Standort erstellen
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        {loading && !openDialog && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && (
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
                            alert('Diese Funktion ist noch nicht implementiert.');
                          }
                        }}
                        disabled={loading}
                      >
                        Löschen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {locations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      Keine Standorte gefunden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
              disabled={loading}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateLocation}
            disabled={!newLocation.name || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;
