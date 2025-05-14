// frontend/src/pages/ManageButtonsPage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getButtonsForUser, createCustomButton, setButtonPermissions } from '../services/api';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Checkbox, List, ListItem, 
  ListItemText, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

const ManageButtonsPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [buttons, setButtons] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [permissionsDialog, setPermissionsDialog] = useState(false);
  const [selectedButton, setSelectedButton] = useState<any>(null);
  const [newButton, setNewButton] = useState({
    name: '',
    url: '',
    locationId: currentLocation?.id || ''
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentLocation) {
      fetchButtons();
    }
  }, [currentLocation]);

  const fetchButtons = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    try {
      const data = await getButtonsForUser(currentLocation.id);
      setButtons(data);
    } catch (error) {
      console.error('Error fetching buttons:', error);
      setError('Fehler beim Laden der Buttons.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateButton = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await createCustomButton(newButton.name, newButton.url, newButton.locationId);
      setOpenDialog(false);
      setNewButton({
        name: '',
        url: '',
        locationId: currentLocation?.id || ''
      });
      
      setSuccess('Button erfolgreich erstellt.');
      await fetchButtons();
    } catch (error) {
      console.error('Error creating button:', error);
      setError('Fehler beim Erstellen des Buttons.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPermissions = (button: any) => {
    setSelectedButton(button);
    setSelectedRoles([]);
    setPermissionsDialog(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedButton) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await setButtonPermissions(selectedButton.id, { roles: selectedRoles });
      setPermissionsDialog(false);
      setSuccess('Berechtigungen erfolgreich gespeichert.');
      
      // Refresh buttons
      await fetchButtons();
    } catch (error) {
      console.error('Error saving permissions:', error);
      setError('Fehler beim Speichern der Berechtigungen.');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(role)) {
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  if (!user || !currentLocation) return null;

  // Only leads and developers can manage buttons
  if (user.role !== 'developer' && user.role !== 'lead') {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Keine Berechtigung</Typography>
        <Typography>Sie haben keine Berechtigung, diese Seite zu sehen.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Buttons verwalten
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
          Neuen Button erstellen
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        {loading && !openDialog && !permissionsDialog && (
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
                  <TableCell>URL</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {buttons.map((button) => (
                  <TableRow key={button.id}>
                    <TableCell>{button.name}</TableCell>
                    <TableCell>{button.url}</TableCell>
                    <TableCell align="right">
                      <Button 
                        variant="outlined" 
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenPermissions(button)}
                        disabled={loading}
                      >
                        Berechtigungen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {buttons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">Keine Buttons gefunden</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neuen Button erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={newButton.name}
              onChange={(e) => setNewButton({...newButton, name: e.target.value})}
              sx={{ mb: 3 }}
              disabled={loading}
            />
            
            <TextField
              label="URL"
              fullWidth
              value={newButton.url}
              onChange={(e) => setNewButton({...newButton, url: e.target.value})}
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
            onClick={handleCreateButton}
            disabled={!newButton.name || !newButton.url || loading}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={permissionsDialog} onClose={() => setPermissionsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Berechtigungen für {selectedButton?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
            Wählen Sie aus, welche Rollen diesen Button sehen können:
          </Typography>
          
          <List>
            <ListItem>
              <Checkbox
                checked={selectedRoles.includes('teacher')}
                onChange={() => toggleRole('teacher')}
                disabled={loading}
              />
              <ListItemText primary="Lehrer" />
            </ListItem>
            <ListItem>
              <Checkbox
                checked={selectedRoles.includes('office')}
                onChange={() => toggleRole('office')}
                disabled={loading}
              />
              <ListItemText primary="Büro" />
            </ListItem>
            <ListItem>
              <Checkbox
                checked={selectedRoles.includes('lead')}
                onChange={() => toggleRole('lead')}
                disabled={loading}
              />
              <ListItemText primary="Leitung" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialog(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSavePermissions}
            disabled={loading}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageButtonsPage;
