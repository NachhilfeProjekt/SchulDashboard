import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getButtonsForUser, createCustomButton, setButtonPermissions } from '../services/api';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Checkbox, List, ListItem, 
  ListItemText 
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

  useEffect(() => {
    if (currentLocation) {
      const fetchButtons = async () => {
        try {
          const data = await getButtonsForUser(currentLocation.id);
          setButtons(data);
        } catch (error) {
          console.error('Error fetching buttons:', error);
        }
      };
      fetchButtons();
    }
  }, [currentLocation]);

  const handleCreateButton = async () => {
    try {
      await createCustomButton(newButton.name, newButton.url, newButton.locationId);
      setOpenDialog(false);
      setNewButton({
        name: '',
        url: '',
        locationId: currentLocation?.id || ''
      });
      
      if (currentLocation) {
        const data = await getButtonsForUser(currentLocation.id);
        setButtons(data);
      }
    } catch (error) {
      console.error('Error creating button:', error);
    }
  };

  const handleOpenPermissions = (button: any) => {
    setSelectedButton(button);
    setSelectedRoles([]);
    setPermissionsDialog(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedButton) return;
    
    try {
      await setButtonPermissions(selectedButton.id, { roles: selectedRoles });
      setPermissionsDialog(false);
      
      // Refresh buttons
      if (currentLocation) {
        const data = await getButtonsForUser(currentLocation.id);
        setButtons(data);
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
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
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Neuen Button erstellen
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
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
      </Paper>
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neuen Button erstellen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Name"
              full<TextField
              label="Name"
              fullWidth
              value={newButton.name}
              onChange={(e) => setNewButton({...newButton, name: e.target.value})}
              sx={{ mb: 3 }}
            />
            
            <TextField
              label="URL"
              fullWidth
              value={newButton.url}
              onChange={(e) => setNewButton({...newButton, url: e.target.value})}
              sx={{ mb: 3 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Abbrechen</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateButton}
            disabled={!newButton.name || !newButton.url}
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
              />
              <ListItemText primary="Lehrer" />
            </ListItem>
            <ListItem>
              <Checkbox
                checked={selectedRoles.includes('office')}
                onChange={() => toggleRole('office')}
              />
              <ListItemText primary="Büro" />
            </ListItem>
            <ListItem>
              <Checkbox
                checked={selectedRoles.includes('lead')}
                onChange={() => toggleRole('lead')}
              />
              <ListItemText primary="Leitung" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialog(false)}>Abbrechen</Button>
          <Button 
            variant="contained" 
            onClick={handleSavePermissions}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageButtonsPage;
