import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { 
  getUsersByLocation, 
  inviteUserToLocation, 
  getAllLocations,
  toggleUserLocationStatus,
  getUserInactiveLocations
} from '../services/api';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import EmailIcon from '@mui/icons-material/Email';

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
      id={`location-tabpanel-${index}`}
      aria-labelledby={`location-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const LocationManagementPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [inactiveLocationsDialogOpen, setInactiveLocationsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inactiveLocations, setInactiveLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Einladungsdaten
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('teacher');
  const [inviteLocation, setInviteLocation] = useState(currentLocation?.id || '');
  
  useEffect(() => {
    if (currentLocation) {
      fetchUsers();
      fetchLocations();
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
      setError('Fehler beim Laden der Benutzer.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const data = await getAllLocations();
      setAllLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInactiveLocations = async (userId: string) => {
    setLoading(true);
    try {
      const data = await getUserInactiveLocations(userId);
      setInactiveLocations(data);
    } catch (error) {
      console.error('Error fetching inactive locations:', error);
      setInactiveLocations([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole || !inviteLocation) return;
    
    setActionLoading('invite');
    setError('');
    setSuccess('');
    
    try {
      await inviteUserToLocation(inviteEmail, inviteLocation, inviteRole);
      setSuccess('Einladung erfolgreich versendet.');
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('teacher');
      setInviteLocation(currentLocation?.id || '');
      
      // Benutzer neu laden, falls ein vorhandener Benutzer eingeladen wurde
      await fetchUsers();
    } catch (error) {
      console.error('Error inviting user:', error);
      setError('Fehler beim Einladen des Benutzers.');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleDeactivateUser = async (userId: string) => {
    if (!currentLocation) return;
    
    setActionLoading(userId);
    setError('');
    setSuccess('');
    
    try {
      await toggleUserLocationStatus(userId, currentLocation.id, false);
      setSuccess('Benutzer für diesen Standort deaktiviert.');
      await fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      setError('Fehler beim Deaktivieren des Benutzers.');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleReactivateUser = async (userId: string, locationId: string) => {
    setActionLoading(userId);
    setError('');
    setSuccess('');
    
    try {
      await toggleUserLocationStatus(userId, locationId, true);
      setSuccess('Benutzer für diesen Standort reaktiviert.');
      await fetchInactiveLocations(userId);
      await fetchUsers();
    } catch (error) {
      console.error('Error reactivating user:', error);
      setError('Fehler beim Reaktivieren des Benutzers.');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleViewInactiveLocations = async (user: any) => {
    setSelectedUser(user);
    await fetchInactiveLocations(user.id);
    setInactiveLocationsDialogOpen(true);
  };

  // Zugriffsberechtigungen prüfen
  if (!user || (user.role !== 'developer' && user.role !== 'lead')) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Keine Berechtigung</Typography>
        <Typography>Sie haben keine Berechtigung, diese Seite zu sehen.</Typography>
      </Box>
    );
  }
  
  if (!currentLocation) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Kein Standort ausgewählt</Typography>
        <Typography>Bitte wählen Sie einen Standort im Dropdown-Menü oben.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Standortverwaltung - {currentLocation.name}
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
          startIcon={<EmailIcon />}
          onClick={() => setInviteDialogOpen(true)}
          sx={{ mr: 2 }}
        >
          Neuen Benutzer einladen
        </Button>
        
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setAddUserDialogOpen(true)}
        >
          Vorhandenen Benutzer hinzufügen
        </Button>
      </Box>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Aktive Benutzer" />
        <Tab label="Standort-Berechtigungen" />
      </Tabs>
      
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>E-Mail</TableCell>
                    <TableCell>Rolle</TableCell>
                    <TableCell>Status</TableCell>
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
                        <Chip
                          label="Aktiv"
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handleDeactivateUser(user.id)}
                          disabled={
                            (user.role === 'developer' && user.role !== 'developer') ||
                            user.id === user?.id ||
                            actionLoading !== null
                          }
                        >
                          {actionLoading === user.id ? (
                            <CircularProgress size={24} />
                          ) : (
                            <BlockIcon color="warning" />
                          )}
                        </IconButton>
                        
                        <IconButton
                          onClick={() => handleViewInactiveLocations(user)}
                          disabled={actionLoading !== null}
                        >
                          <RestoreIcon />
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
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Berechtigungsverwaltung
          </Typography>
          
          <Typography paragraph>
            Hier können Sie einstellen, welche Benutzer an welchen Standorten Berechtigungen haben.
            Deaktivierte Benutzer verlieren den Zugriff auf einen Standort, können aber später wieder aktiviert werden.
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom>
            Berechtigungen:
          </Typography>
          
          <Typography>
            <strong>Entwickler:</strong> Haben Zugriff auf alle Standorte und volle Administrationsrechte.
          </Typography>
          <Typography>
            <strong>Leitungen:</strong> Können Benutzer an ihren Standorten verwalten und einladen.
          </Typography>
          <Typography>
            <strong>Büro:</strong> Haben grundlegende Zugriffsrechte auf die Dashboard-Funktionen.
          </Typography>
          <Typography>
            <strong>Lehrer:</strong> Haben eingeschränkte Zugriffsrechte auf bestimmte Dashboard-Funktionen.
          </Typography>
        </Paper>
      </TabPanel>
      
      {/* Dialog: Neuen Benutzer einladen */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Neuen Benutzer einladen</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="E-Mail"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              sx={{ mb: 3 }}
              disabled={actionLoading === 'invite'}
            />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Rolle</InputLabel>
              <Select
                value={inviteRole}
                label="Rolle"
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={actionLoading === 'invite'}
              >
                <MenuItem value="teacher">Lehrer</MenuItem>
                <MenuItem value="office">Büro</MenuItem>
                {user?.role === 'developer' && (
                  <MenuItem value="lead">Leitung</MenuItem>
                )}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Standort</InputLabel>
              <Select
                value={inviteLocation}
                label="Standort"
                onChange={(e) => setInviteLocation(e.target.value)}
                disabled={actionLoading === 'invite'}
              >
                {user?.role === 'developer' ? (
                  allLocations.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value={currentLocation.id}>
                    {currentLocation.name}
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            
            <Typography variant="body2" color="textSecondary">
              Der Benutzer erhält eine E-Mail mit einem Link zur Registrierung und Passwort-Festlegung.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setInviteDialogOpen(false)} 
            disabled={actionLoading === 'invite'}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={handleInviteUser}
            disabled={!inviteEmail || !inviteRole || !inviteLocation || actionLoading === 'invite'}
            startIcon={actionLoading === 'invite' ? <CircularProgress size={20} /> : null}
          >
            Einladen
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog: Benutzer an inaktiven Standorten */}
      <Dialog
        open={inactiveLocationsDialogOpen}
        onClose={() => setInactiveLocationsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Inaktive Standorte für {selectedUser?.email}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {inactiveLocations.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Standort</TableCell>
                        <TableCell align="right">Aktionen</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {inactiveLocations.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell>{location.name}</TableCell>
                          <TableCell align="right">
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<RestoreIcon />}
                              onClick={() => handleReactivateUser(selectedUser.id, location.id)}
                              disabled={actionLoading === selectedUser.id}
                            >
                              Reaktivieren
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>
                  Dieser Benutzer hat keine inaktiven Standorte.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInactiveLocationsDialogOpen(false)}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationManagementPage;
