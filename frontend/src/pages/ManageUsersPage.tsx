import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { getUsersByLocation, createUser, deactivateUser } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, 
  InputLabel, Select, MenuItem, Chip, IconButton, Alert, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { User } from '../types';

const ManageUsersPage: React.FC = () => {
  const { user: currentUser, currentLocation } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'teacher',
    locations: currentLocation ? [currentLocation.id] : []
  });
  const [deactivateLoading, setDeactivateLoading] = useState<string | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<any | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (currentLocation) {
      fetchUsers();
    }
  }, [currentLocation]);

  const fetchUsers = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    try {
      const data = await getUsersByLocation(currentLocation.id);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Fehler beim Laden der Benutzer. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await createUser(newUser.email, newUser.role, newUser.locations);
      setOpenDialog(false);
      setNewUser({
        email: '',
        role: 'teacher',
        locations: currentLocation ? [currentLocation.id] : []
      });
      
      setSuccess('Benutzer wurde erfolgreich erstellt. Eine E-Mail mit temporärem Passwort wurde versendet.');
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Fehler beim Erstellen des Benutzers. Möglicherweise existiert die E-Mail bereits.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUserClick = (user: any) => {
    setUserToDeactivate(user);
    setConfirmDialogOpen(true);
  };
  
  const confirmDeactivateUser = async () => {
    if (!userToDeactivate) return;
    
    setDeactivateLoading(userToDeactivate.id);
    setError('');
    setSuccess('');
    
    try {
      await deactivateUser(userToDeactivate.id);
      setSuccess(`Benutzer "${userToDeactivate.email}" wurde erfolgreich deaktiviert.`);
      await fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      
      // Spezifischere Fehlermeldungen basierend auf der API-Antwort
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Fehler beim Deaktivieren des Benutzers.');
      }
    } finally {
      setDeactivateLoading(null);
      setUserToDeactivate(null);
      setConfirmDialogOpen(false);
    }
  };

  if (!currentUser || !currentLocation) return null;

  // Nur Developer und Leads dürfen Benutzer verwalten
  if (currentUser.role !== 'developer' && currentUser.role !== 'lead') {
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
        Mitarbeiter verwalten
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
          Neuen Mitarbeiter anlegen
        </Button>
      </Box>
      
      <Paper sx={{ p: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {!loading && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>E-Mail</TableCell>
                  <TableCell>Rolle</TableCell>
                  <TableCell>Standorte</TableCell>
                  <TableCell align="right">Aktionen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={
                          user.role === 'developer' ? 'Entwickler' :
                          user.role === 'lead' ? 'Leitung' :
                          user.role === 'office' ? 'Büro' :
                          'Lehrer'
                        } 
                        color={
                          user.role === 'developer' ? 'primary' : 
                          user.role === 'lead' ? 'secondary' : 'default'
                        } 
                      />
                    </TableCell>
                    <TableCell>
                      {user.locations?.map((loc: any) => (
                        <Chip key={loc.id} label={loc.name} sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        onClick={() => navigate(`/edit-user/${user.id}`)}
                        sx={{ mr: 1 }}
                        disabled={loading}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeactivateUserClick(user)}
                        disabled={
                          user.role === 'developer' && currentUser.role !== 'developer' ||
                          user.id === currentUser.id ||
                          loading ||
                          deactivateLoading === user.id
                        }
                      >
                        {deactivateLoading === user.id ? (
                          <CircularProgress size={24} />
                        ) : (
                          <DeleteIcon color="error" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Keine Benutzer gefunden
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neuen Mitarbeiter anlegen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="E-Mail"
              fullWidth
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              sx={{ mb: 3 }}
              disabled={loading}
            />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Rolle</InputLabel>
              <Select
                value={newUser.role}
                label="Rolle"
                onChange={(e) => setNewUser({...newUser, role: e.target.value as string})}
                disabled={loading}
              >
                <MenuItem value="teacher">Lehrer</MenuItem>
                <MenuItem value="office">Büro</MenuItem>
                {currentUser.role === 'developer' && (
                  <MenuItem value="lead">Leitung</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateUser}
            disabled={!newUser.email || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Erstellen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bestätigungsdialog für die Deaktivierung von Benutzern */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Benutzer deaktivieren</DialogTitle>
        <DialogContent>
          <Typography>
            Möchten Sie den Benutzer "{userToDeactivate?.email}" wirklich deaktivieren?
          </Typography>
          <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
            Der Benutzer verliert sofort den Zugriff auf das System.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={deactivateLoading !== null}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeactivateUser}
            disabled={deactivateLoading !== null}
          >
            Deaktivieren
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageUsersPage;
