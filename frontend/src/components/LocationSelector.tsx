import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { setCurrentLocation, updateUserLocations } from '../store/authSlice';
import { getUserLocations } from '../services/api';
import { 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  SelectChangeEvent,
  Menu,
  Button,
  Typography,
  Divider,
  ListItem,
  ListItemText,
  Box,
  IconButton
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';

const LocationSelector: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, locations, currentLocation } = useSelector((state: RootState) => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (user && locations.length === 0) {
      refreshLocations();
    }
  }, [user]);

  const handleChange = (event: SelectChangeEvent) => {
    const selectedLocation = locations.find(loc => loc.id === event.target.value);
    if (selectedLocation) {
      dispatch(setCurrentLocation(selectedLocation));
      localStorage.setItem('schul_dashboard_current_location', JSON.stringify(selectedLocation));
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const refreshLocations = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const userLocations = await getUserLocations();
      dispatch(updateUserLocations(userLocations));
      
      // Wenn der aktuelle Standort nicht in der Liste ist, wähle den ersten aus
      if (userLocations.length > 0) {
        const isCurrentLocationValid = userLocations.some(
          loc => currentLocation && loc.id === currentLocation.id
        );
        
        if (!isCurrentLocationValid) {
          dispatch(setCurrentLocation(userLocations[0]));
          localStorage.setItem('schul_dashboard_current_location', JSON.stringify(userLocations[0]));
        }
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Standorte:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (!user || locations.length === 0) {
    return (
      <Button 
        variant="text" 
        color="inherit" 
        startIcon={<RefreshIcon />}
        onClick={refreshLocations}
        disabled={refreshing}
      >
        Standorte laden
      </Button>
    );
  }

  // Dropdown für Standortwechsel
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="location-select-label">Standort</InputLabel>
        <Select
          labelId="location-select-label"
          value={currentLocation?.id || ''}
          label="Standort"
          onChange={handleChange}
          startAdornment={<LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />}
        >
          {locations.map((location) => (
            <MenuItem key={location.id} value={location.id}>
              {location.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <IconButton 
        onClick={handleClick}
        size="small"
        sx={{ ml: 1 }}
      >
        <MoreVertIcon />
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <Typography variant="subtitle2" sx={{ p: 2, pb: 0 }}>
          Standortverwaltung
        </Typography>
        <Divider sx={{ my: 1 }} />
        
        <MenuItem onClick={() => {
          refreshLocations();
          handleClose();
        }} disabled={refreshing}>
          <ListItemText 
            primary="Standorte aktualisieren" 
            secondary="Lädt die Liste aller verfügbaren Standorte neu"
          />
        </MenuItem>
        
        {(user.role === 'developer' || user.role === 'lead') && (
          <MenuItem onClick={() => {
            window.location.href = '/location-management';
            handleClose();
          }}>
            <ListItemText 
              primary="Standorte verwalten" 
              secondary="Benutzer einladen oder löschen"
            />
          </MenuItem>
        )}
        
        {user.role === 'developer' && (
          <MenuItem onClick={() => {
            window.location.href = '/admin';
            handleClose();
          }}>
            <ListItemText 
              primary="Standort-Administration" 
              secondary="Standorte erstellen oder löschen"
            />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default LocationSelector;
