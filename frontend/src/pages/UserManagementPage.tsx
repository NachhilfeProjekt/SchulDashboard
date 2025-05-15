// frontend/src/pages/UserManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { 
  getUsersByLocation, 
  getDeactivatedUsers, 
  getUserActivityLog, 
  reactivateUser, 
  deleteUser 
} from '../services/api';
import { 
  Box, Typography, Paper, Tabs, Tab, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Button, IconButton, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, Alert, CircularProgress 
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HistoryIcon from '@mui/icons-material/History';

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
      id={`user-admin-tabpanel-${index}`}
      aria-labelledby={`user-admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const UserManagementPage: React.FC = () => {
  const { user: currentUser, currentLocation } = useSelector((state: RootState) => state.auth);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [deactivatedUsers, setDeactivatedUsers] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'reactivate' | 'delete' | null>(null);
  const [activityLogDialogOpen, setActivityLogDialogOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'developer') {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch both active and deactivated users
      if (currentLocation) {
        const active = await getUsersByLocation(currentLocation.id);
        setActiveUsers(active);
      }
      
      try {
        const deactivated = await getDeactivatedUsers();
        setDeactivatedUsers(deactivated);
      } catch (error) {
        console.error('Error fetching deactivated users:', error);
        setDeactivatedUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Fehler beim Laden der Benutzerdaten.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewActivityLog = async (user: any) => {
    setSelectedUser(user);
    setLoading(true);
    
    try {
      try {
        const log = await getUserActivityLog(user.id);
        setActivityLog(log);
      } catch (error) {
        console.error('Error fetching activity log:', error);
        setActivityLog([]);
      }
      setActivityLogDialogOpen(true);
    } catch (error) {
      console.error('Error preparing activity log view:', error);
      setError('Fehler beim Laden des Aktivitätsprotokolls.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (user: any, action: 'reactivate' | 'delete') => {
    setSelectedUser(user);
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  // Umbenennung von confirmAction zu handleConfirmAction, um Kollision zu vermeiden
  const handleConfirmAction = async () => {
    if (!selectedUser || !confirmAction) return;
    
    setActionLoading(selectedUser.id);
    setError('');
    setSuccess('');
    
    try {
      if (confirmAction === 'reactivate') {
        await reactivateUser(selectedUser.id);
        setSuccess(`Benutzer "${selectedUser.email}" wurde erfolgreich reaktiviert.`);
      } else if (confirmAction === 'delete') {
        await deleteUser(selectedUser.id);
        setSuccess(`Benutzer "${selectedUser.email}" wurde erfolgreich gelöscht.`);
      }
      
      await fetchData();
    } catch (error) {
      console.error(`Error ${confirmAction} user:`, error);
      setError(`Fehler beim ${confirmAction === 'reactivate' ? 'Reaktivieren' : 'Löschen'} des Benutzers.`);
    } finally {
      setActionLoading(null);
      setSelectedUser(null);
      setConfirmAction(null);
      setConfirmDialogOpen(false);
    }
  };

  // Nur Entwickler dürfen diese Seite sehen
  if (currentUser?.role !== 'developer') {
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
        Erweiterte Benutzerverwaltung
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
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs">
          <Tab label="Aktive Benutzer" id="user-admin-tab-0" />
          <Tab label="Deaktivierte Benutzer" id="user-admin-tab-1" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Aktive Benutzer
          </Typography>
          
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
                    <TableCell>Erstellt am</TableCell>
                    <TableCell align="right">Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeUsers.map((user) => (
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
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('de-DE') : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          onClick={() => handleViewActivityLog(user)}
                          disabled={actionLoading === user.id}
                          sx={{ mr: 1 }}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Keine aktiven Benutzer gefunden
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
            Deaktivierte Benutzer
          </Typography>
          
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
                          onClick={() => handleAction(user, 'reactivate')}
                          disabled={actionLoading === user.id}
                          sx={{ mr: 1 }}
                        >
                          {actionLoading === user.id ? (
                            <CircularProgress size={24} />
                          ) : (
                            <RestoreIcon color="primary" />
                          )}
                        </IconButton>
                        
                        <IconButton 
                          onClick={() => handleAction(user, 'delete')}
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <CircularProgress size={24} />
                          ) : (
                            <DeleteForeverIcon color="error" />
                          )}
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
      
      {/* Bestätigungsdialog für Aktionen */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => {
          if (!actionLoading) {
            setConfirmDialogOpen(false);
            setSelectedUser(null);
            setConfirmAction(null);
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmAction === 'reactivate' ? 'Benutzer reaktivieren' : 'Benutzer permanent löschen'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmAction === 'reactivate' 
              ? `Möchten Sie den Benutzer "${selectedUser?.email}" wirklich reaktivieren?`
              : `Möchten Sie den Benutzer "${selectedUser?.email}" wirklich permanent löschen?`
            }
          </Typography>
          
          <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
            {confirmAction === 'reactivate' 
              ? 'Der Benutzer erhält wieder Zugriff auf das System mit seinen vorherigen Berechtigungen.' 
              : 'WARNUNG: Diese Aktion entfernt den Benutzer permanent und kann nicht rückgängig gemacht werden!'
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setConfirmDialogOpen(false);
              setSelectedUser(null);
              setConfirmAction(null);
            }}
            disabled={actionLoading !== null}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            color={confirmAction === 'reactivate' ? 'primary' : 'error'}
            onClick={handleConfirmAction} // Hier zur umbenannten Funktion ändern
            disabled={actionLoading !== null}
          >
            {confirmAction === 'reactivate' ? 'Reaktivieren' : 'Permanent löschen'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog für Aktivitätsprotokoll */}
      <Dialog
        open={activityLogDialogOpen}
        onClose={() => {
          setActivityLogDialogOpen(false);
          setSelectedUser(null);
          setActivityLog([]);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Aktivitätsprotokoll: {selectedUser?.email}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Aktion</TableCell>
                    <TableCell>Durchgeführt von</TableCell>
                    <TableCell>Datum</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityLog.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Chip 
                          label={
                            log.action === 'created' ? 'Erstellt' :
                            log.action === 'deactivated' ? 'Deaktiviert' :
                            log.action === 'reactivated' ? 'Reaktiviert' :
                            log.action === 'password_reset' ? 'Passwort zurückgesetzt' :
                            log.action
                          }
                          color={
                            log.action === 'created' || log.action === 'reactivated' ? 'success' :
                            log.action === 'deactivated' ? 'warning' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{log.performed_by_email || '-'}</TableCell>
                      <TableCell>
                        {new Date(log.performed_at).toLocaleString('de-DE')}
                      </TableCell>
                      <TableCell>
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {activityLog.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Keine Aktivitäten gefunden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setActivityLogDialogOpen(false);
              setSelectedUser(null);
              setActivityLog([]);
            }}
          >
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagementPage;
