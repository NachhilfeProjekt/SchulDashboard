// frontend/src/pages/LocationManagementPage.tsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setCurrentLocation } from '../store/authSlice';
import { getUserLocations, getAllLocations, inviteUserToLocation } from '../services/api';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  FormControl, InputLabel, Select, MenuItem, TextField, CircularProgress,
  Tabs, Tab, Divider, Alert, SelectChangeEvent
} from '@mui/material';
import AddLocationIcon from '@mui/icons-material/AddLocation';

// Stellen Sie sicher, dass Sie einen expliziten Namen für die Komponente verwenden
const LocationManagementPage: React.FC = () => {
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog state
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState<string>('teacher'); // Default role
  
  // Lade Standortdaten beim Komponenten-Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Lade die Standorte des aktuellen Benutzers
        const locations = await getUserLocations();
        setUserLocations(locations);
        
        // Wenn der Benutzer ein Developer oder Administrator ist, lade alle verfügbaren Standorte
        if (user?.role === 'developer' || user?.role === 'admin') {
          const allLocations = await getAllLocations();
          // Filtere die Standorte, zu denen der Benutzer noch keinen Zugang hat
          const filteredLocations = allLocations.filter(
            location => !locations.some(userLoc => userLoc.id === location.id)
          );
          setAvailableLocations(filteredLocations);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Fehler beim Laden der Standorte. Bitte versuchen Sie es später erneut.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);
  
  // Handler für Tab-Wechsel
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Standort wechseln
  const switchLocation = (location: any) => {
    dispatch(setCurrentLocation(location));
    setSuccessMessage(`Standort zu ${location.name} gewechselt.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  // Dialog öffnen für Einladung
  const handleOpenInviteDialog = (locationId: string) => {
    setSelectedLocation(locationId);
    setUserEmail('');
    setRole('teacher');
    setOpenInviteDialog(true);
  };
  
  // Dialog schließen
  const handleCloseInviteDialog = () => {
    setOpenInviteDialog(false);
  };
  
  // Einladung senden
  const handleInvite = async () => {
    if (!selectedLocation || !userEmail || !role) {
      setError('Bitte füllen Sie alle Felder aus.');
      return;
    }
    
    try {
      await inviteUserToLocation(selectedLocation, userEmail, role);
      setSuccessMessage(`Einladung an ${userEmail} erfolgreich gesendet.`);
      handleCloseInviteDialog();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error inviting user:', err);
      setError('Fehler beim Senden der Einladung. Bitte versuchen Sie es später erneut.');
    }
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setRole(event.target.value);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Prüfen, ob der Benutzer Zugriff auf die Standortverwaltung hat
  const canManageLocations = user?.role === 'developer' || user?.role === 'admin' || user?.role === 'manager';
  
  if (!canManageLocations) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Sie haben keine Berechtigung, auf die Standortverwaltung zuzugreifen.</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Standortverwaltung</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Meine Standorte" />
          {(user?.role === 'developer' || user?.role === 'admin') && (
            <Tab label="Weitere Standorte" />
          )}
        </Tabs>
        
        <Divider />
        
        {/* Tab: Meine Standorte */}
        {tabValue === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Standorte, zu denen Sie Zugang haben:
            </Typography>
            
            {userLocations.length === 0 ? (
              <Typography>Sie haben derzeit keinen Zugang zu Standorten.</Typography>
            ) : (
              <List>
                {userLocations.map((location) => (
                  <ListItem 
                    key={location.id}
                    secondaryAction={
                      <Button 
                        variant={currentLocation?.id === location.id ? "contained" : "outlined"}
                        onClick={() => switchLocation(location)}
                        disabled={currentLocation?.id === location.id}
                      >
                        {currentLocation?.id === location.id ? "Aktuell" : "Wechseln"}
                      </Button>
                    }
                  >
                    <ListItemText 
                      primary={location.name} 
                      secondary={`${location.address || 'Keine Adresse angegeben'}`} 
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
        
        {/* Tab: Weitere Standorte (nur für Developer/Admin) */}
        {tabValue === 1 && (user?.role === 'developer' || user?.role === 'admin') && (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Weitere verfügbare Standorte:
            </Typography>
            
            {availableLocations.length === 0 ? (
              <Typography>Keine weiteren Standorte verfügbar.</Typography>
            ) : (
              <List>
                {availableLocations.map((location) => (
                  <ListItem 
                    key={location.id}
                    secondaryAction={
                      <Button 
                        variant="outlined"
                        startIcon={<AddLocationIcon />}
                        onClick={() => handleOpenInviteDialog(location.id)}
                      >
                        Mitarbeiter einladen
                      </Button>
                    }
                  >
                    <ListItemText 
                      primary={location.name} 
                      secondary={`${location.address || 'Keine Adresse angegeben'}`} 
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Dialog für Einladungen */}
      <Dialog open={openInviteDialog} onClose={handleCloseInviteDialog}>
        <DialogTitle>Mitarbeiter zu Standort einladen</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Geben Sie die E-Mail-Adresse des Mitarbeiters ein, den Sie zu diesem Standort einladen möchten,
            und wäh
