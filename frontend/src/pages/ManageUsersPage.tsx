// frontend/src/pages/ManageUsersPage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  getUsersByLocation,
  createUser,
  deactivateUser,
  deleteUser,
  getDeactivatedUsers,
  reactivateUser,
  inviteUserToLocation,
  getAllUsers
} from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, Alert, CircularProgress,
  Tabs, Tab, Divider, OutlinedInput, InputAdornment, Tooltip, List, ListItem, ListItemText, Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { User, Location } from '../types';

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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ManageUsersPage: React.FC = () => {
  const { user: currentUser, currentLocation, locations } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [deactivatedUsers, setDeactivatedUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'teacher',
    locations: currentLocation ? [currentLocation.id] : []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [userToManage, setUserToManage] = useState<any | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'delete' | 'reactivate' | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (currentLocation) {
      fetchUsers();
    }
    if (currentUser?.role === 'developer') {
      fetchDeactivatedUsers();
      fetchAllUsers();
    }
  }, [currentLocation, currentUser]);

  useEffect(() => {
    if (users.length > 0) {
      filterUsers();
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    if (!currentLocation) return;
    setLoading(true);
    try {
      const data = await getUsersByLocation(currentLocation.id);
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Fehler beim Laden der Benutzer. Bitte versuchen Sie es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeactivatedUsers = async () => {
    if (currentUser?.role !== 'developer') return;
    setLoading(true);
    try {
      const data = await getDeactivatedUsers();
      setDeactivatedUsers(data);
    } catch (error) {
      console.error('Error fetching deactivated users:', error);
      // Handle error without UI notification to keep the UX clean
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    if (currentUser?.role !== 'developer' && currentUser?.role !== 'lead') return;
    setLoading(true);
    try {
      const data = await getAllUsers();
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching all users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(query) || 
      user.role.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  const handleUserAction = (user: any, action: 'deactivate' | 'delete' | 'reactivate') => {
    setUserToManage(user);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const confirmUserAction = async () => {
    if (!userToManage || !confirmAction) return;
    setActionLoading(userToManage.id);
    setError('');
    setSuccess('');
    try {
      if (confirmAction === 'deactivate') {
        await deactivateUser(userToManage.id);
        setSuccess(`Benutzer "${userToManage.email}" wurde erfolgreich deaktiviert.`);
        await fetchUsers();
      } else if (confirmAction === 'delete') {
        await deleteUser(userToManage.id);
        setSuccess(`Benutzer "${userToManage.email}" wurde erfolgreich gelöscht.`);
        await fetchUsers();
        if (currentUser?.role === 'developer') {
          await fetchDeactivatedUsers();
        }
      } else if (confirmAction === 'reactivate') {
        await reactivateUser(userToManage.id);
        setSuccess(`Benutzer "${userToManage.email}" wurde erfolgreich reaktiviert.`);
        if (currentUser?.role === 'developer') {
          await fetchDeactivatedUsers();
        }
        await fetchUsers();
      }
    } catch (error) {
      console.error(`Error ${confirmAction} user:`, error);
      // Spezifischere Fehlermeldungen basierend auf der API-Antwort
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(`Fehler beim ${
          confirmAction === 'deactivate' ? 'Deaktivieren' :
          confirmAction === 'delete' ? 'Löschen' :
          'Reaktivieren'
        } des Benutzers.`);
      }
    } finally {
      setActionLoading(null);
      setUserToManage(null);
      setConfirmAction(null);
      setConfirmDialogOpen(false);
    }
  };

  const handleOpenInviteDialog = () => {
    setOpenInviteDialog(true);
    setInviteEmail('');
    setSelectedUser(null);
  };

  const handleSearchForUser = () => {
    if (!inviteEmail.trim()) return;
    
    const foundUser = allUsers.find(user => 
      user.email.toLowerCase() === inviteEmail.toLowerCase()
    );
    
    if (foundUser) {
      setSelectedUser(foundUser);
      setError('');
    } else {
      setSelectedUser(null);
      setError('Kein Benutzer mit dieser E-Mail-Adresse gefunden');
    }
  };

  const handleInviteUser = async () => {
    if (!selectedUser || !currentLocation) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await inviteUserToLocation(selectedUser.id, currentLocation.id);
      setSuccess(`Benutzer "${selectedUser.email}" wurde erfolgreich zu diesem Standort eingeladen.`);
      setOpenInviteDialog(false);
      await fetchUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Fehler beim Einladen des Benutzers. Möglicherweise ist der Benutzer bereits diesem Standort zugeordnet.');
      }
    } finally {
      setLoading(false);
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
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            disabled={loading}
          >
            Neuen Mitarbeiter anlegen
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<PersonAddIcon />}
            onClick={handleOpenInviteDialog}
            disabled={loading}
          >
            Mitarbeiter einladen
          </Button>
        </Box>
        
        <FormControl variant="outlined" size="small" sx={{ width: '250px' }}>
          <OutlinedInput
            placeholder="E-Mail oder Rolle suchen"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            }
            endAdornment={
              searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          />
        </FormControl>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
          <Tab label="Aktive Benutzer" id="user-tab-0" />
          {currentUser.role === 'developer' && (
            <Tab label="Deaktivierte Benutzer" id="user-tab-1" />
          )}
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
          
          {!loading && (
            <TableContainer sx={{ maxHeight: '600px', overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>E-Mail</TableCell>
                    <TableCell>Rolle</TableCell>
                    <TableCell>Standorte</TableCell>
                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
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
                          disabled={loading || actionLoading === user.id}
                        >
                          <EditIcon />
                        </IconButton>
                        
                        <IconButton
                          onClick={() => handleUserAction(user, 'deactivate')}
                          sx={{ mr: 1 }}
                          disabled={
                            user.role === 'developer' && currentUser.role !== 'developer' ||
                            user.id === currentUser.id ||
                            loading ||
                            actionLoading === user.id
                          }
                        >
                          {actionLoading === user.id ? (
                            <CircularProgress size={24} />
                          ) : (
                            <BlockIcon color="warning" />
                          )}
                        </IconButton>
                        
                        {currentUser.role === 'developer' || (currentUser.role === 'lead' && user.role !== 'developer' && user.role !== 'lead') && (
                          <IconButton
                            onClick={() => handleUserAction(user, 'delete')}
                            disabled={
                              user.id === currentUser.id ||
                              loading ||
                              actionLoading === user.id
                            }
                          >
                            <DeleteIcon color="error" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredUsers.length === 0 && (
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
      </TabPanel>

      {currentUser.role === 'developer' && (
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Deaktivierte Benutzer
            </Typography>
            
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
                      <TableCell>Deaktiviert am</TableCell>
                      <TableCell align="right">Aktionen</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deactivatedUsers.map((user) => (
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
                          {user.deactivated_at ? new Date(user.deactivated_at).toLocaleDateString('de-DE') : '-'}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            onClick={() => handleUserAction(user, 'reactivate')}
                            sx={{ mr: 1 }}
                            disabled={loading || actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <CircularProgress size={24} />
                            ) : (
                              <RestoreIcon color="primary" />
                            )}
                          </IconButton>
                          
                          <IconButton
                            onClick={() => handleUserAction(user, 'delete')}
                            disabled={loading || actionLoading === user.id}
                          >
                            <DeleteIcon color="error" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {deactivatedUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          Keine deaktivierten Benutzer gefunden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </TabPanel>
      )}

      {/* Dialog: Neuen Mitarbeiter anlegen */}
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
            
            <Typography variant="subtitle1" gutterBottom>
              Standort: {currentLocation.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Der neue Mitarbeiter wird automatisch dem aktuellen Standort zugewiesen.
            </Typography>
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

      {/* Dialog: Mitarbeiter einladen */}
      <Dialog open={openInviteDialog} onClose={() => setOpenInviteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mitarbeiter zu Standort einladen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Geben Sie die E-Mail-Adresse eines bestehenden Mitarbeiters ein, um ihn zu diesem Standort einzuladen.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 2 }}>
              <TextField
                label="E-Mail-Adresse"
                fullWidth
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={loading}
              />
              <Button
                variant="outlined"
                onClick={handleSearchForUser}
                disabled={loading || !inviteEmail}
              >
                Suchen
              </Button>
            </Box>
            
            {selectedUser && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2, mb: 2 }}>
                <Typography variant="subtitle1">Gefundener Benutzer:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Typography sx={{ mr: 1 }}>{selectedUser.email}</Typography>
                  <Chip
                    label={
                      selectedUser.role === 'developer' ? 'Entwickler' :
                      selectedUser.role === 'lead' ? 'Leitung' :
                      selectedUser.role === 'office' ? 'Büro' :
                      'Lehrer'
                    }
                    size="small"
                    color={
                      selectedUser.role === 'developer' ? 'primary' :
                      selectedUser.role === 'lead' ? 'secondary' : 'default'
                    }
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {selectedUser.is_active 
                    ? 'Benutzer ist aktiv'
                    : 'Benutzer ist derzeit deaktiviert und wird nach der Einladung reaktiviert.'}
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteDialog(false)} disabled={loading}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={handleInviteUser}
            disabled={!selectedUser || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Einladen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bestätigungsdialog für Benutzeraktionen */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => {
          if (!actionLoading) {
            setConfirmDialogOpen(false);
            setUserToManage(null);
            setConfirmAction(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmAction === 'deactivate' ? 'Benutzer deaktivieren' :
           confirmAction === 'delete' ? 'Benutzer permanent löschen' :
           'Benutzer reaktivieren'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmAction === 'deactivate' && `Möchten Sie den Benutzer "${userToManage?.email}" wirklich deaktivieren?`}
            {confirmAction === 'delete' && `Möchten Sie den Benutzer "${userToManage?.email}" wirklich permanent löschen?`}
            {confirmAction === 'reactivate' && `Möchten Sie den Benutzer "${userToManage?.email}" wirklich reaktivieren?`}
          </Typography>
          
          <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
            {confirmAction === 'deactivate' &&
              'Der Benutzer verliert sofort den Zugriff auf das System, kann aber später wieder aktiviert werden.'
            }
            {confirmAction === 'delete' &&
              'WARNUNG: Diese Aktion entfernt den Benutzer permanent und kann nicht rückgängig gemacht werden!'
            }
            {confirmAction === 'reactivate' &&
              'Der Benutzer erhält wieder Zugriff auf das System mit seinen vorherigen Berechtigungen.'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmDialogOpen(false);
              setUserToManage(null);
              setConfirmAction(null);
            }}
            disabled={actionLoading !== null}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color={
              confirmAction === 'deactivate' ? 'warning' :
              confirmAction === 'delete' ? 'error' :
              'primary'
            }
            onClick={confirmUserAction}
            disabled={actionLoading !== null}
          >
            {confirmAction === 'deactivate' ? 'Deaktivieren' :
             confirmAction === 'delete' ? 'Permanent löschen' :
             'Reaktivieren'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageUsersPage;
