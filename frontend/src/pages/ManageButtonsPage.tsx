// frontend/src/pages/ManageButtonsPage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getButtonsForUser, createCustomButton, setButtonPermissions, deleteButton, getUsersByLocation } from '../services/api';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Checkbox, List, ListItem, 
  ListItemText, CircularProgress, Alert, Tab, Tabs
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ManageButtonsPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [buttons, setButtons] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [permissionsDialog, setPermissionsDialog] = useState(false);
  const [selectedButton, setSelectedButton] = useState<any>(null);
  const [newButton, setNewButton] = useState({
    name: '',
    url: '',
    locationId: currentLocation?.id || ''
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [buttonToDelete, setButtonToDelete] = useState<any>(null);

  useEffect(() => {
    if (currentLocation) {
      fetchButtons();
      fetchUsers();
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

  const fetchUsers = async () => {
    if (!currentLocation) return;
    
    try {
      const data = await getUsersByLocation(currentLocation.id);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Silent error - nicht kritisch für die Hauptfunktionalität
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
    setSelectedUsers([]);
    setPermissionsDialog(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedButton) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await setButtonPermissions(selectedButton.id, { 
        roles: selectedRoles,
        users: selectedUsers
      });
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

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleDeleteButtonClick = (button: any) => {
    setButtonToDelete(button);
    setConfirmDeleteDialog(true);
  };

  const handleDeleteButton = async () => {
    if (!buttonToDelete) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await deleteButton(buttonToDelete.id);
      setConfirmDeleteDialog(false);
      setButtonToDelete(null);
      setSuccess('Button erfolgreich gelöscht.');
      
      // Refresh buttons
      await fetchButtons();
    } catch (error) {
      console.error('Error deleting button:', error);
      setError('Fehler beim Löschen des Buttons.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Buttons" />
        <Tab label="Berechtigungen" />
      </Tabs>
      
      <TabPanel value={tabValue} index={0}>
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
                      <TableCell>
                        <a href={button.url} target="_blank" rel="noopener noreferrer">
                          {button.url}
                        </a>
                      </TableCell>
                      <TableCell align="right">
                        <Button 
                          variant="outlined" 
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenPermissions(button)}
                          disabled={loading}
                          sx={{ mr: 1 }}
                        >
                          Berechtigungen
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteButtonClick(button)}
                          disabled={loading}
                        >
                          Löschen
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
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Button-Berechtigungen
        </Typography>
        
        <Typography variant="body1" gutterBottom>
          In diesem Bereich können Sie festlegen, welche Rollen und Benutzer Zugriff auf bestimmte Buttons haben.
          Wählen Sie einen Button in der Button-Tabelle aus und klicken Sie auf "Berechtigungen", um die Zugriffsrechte zu verwalten.
        </Typography>
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Hinweis:</strong> Entwickler haben immer Zugriff auf alle Buttons. Leitungen können Buttons nur für ihre eigenen Standorte erstellen und verwalten.
        </Typography>
      </TabPanel>
      
      {/* Button erstellen Dialog */}
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
              placeholder="https://example.com"
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
      
      {/* Berechtigungen Dialog */}
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
          
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 2 }}>
            Oder wählen Sie spezifische Benutzer aus:
          </Typography>
          
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {users.map((user) => (
              <ListItem key={user.id}>
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  disabled={loading}
                />
                <ListItemText 
                  primary={user.email} 
                  secondary={
                    user.role === 'developer' ? 'Entwickler' :
                    user.role === 'lead' ? 'Leitung' :
                    user.role === 'office' ? 'Büro' :
                    'Lehrer'
                  } 
                />
              </ListItem>
            ))}
            {users.length === 0 && (
              <ListItem>
                <ListItemText primary="Keine Benutzer verfügbar" />
              </ListItem>
            )}
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
      
      {/* Bestätigungsdialog für Löschen */}
      <Dialog open={confirmDeleteDialog} onClose={() => setConfirmDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Button löschen</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie den Button "{buttonToDelete?.name}" wirklich löschen?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDialog(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteButton}
            disabled={loading}
          >
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageButtonsPage;
