// Verbesserte LocationSelector-Komponente (ersetzen Sie die bestehende Datei)
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { setCurrentLocation } from '../store/authSlice';
import { MenuItem, Select, FormControl, InputLabel, SelectChangeEvent, Button, Menu, ListItemText, ListItemIcon, Box, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const LocationSelector: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { locations, currentLocation } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLocationChange = (locationId: string) => {
    const selectedLocation = locations.find(loc => loc.id === locationId);
    if (selectedLocation) {
      dispatch(setCurrentLocation(selectedLocation));
    }
    handleClose();
  };

  if (locations.length <= 1) return null;

  return (
    <Box sx={{ mr: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        startIcon={<LocationOnIcon />}
        sx={{ 
          textTransform: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
          }
        }}
      >
        {currentLocation?.name || 'Standort wählen'}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {locations.map((location) => (
          <MenuItem 
            key={location.id} 
            selected={currentLocation?.id === location.id}
            onClick={() => handleLocationChange(location.id)}
          >
            <ListItemIcon>
              <LocationOnIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={location.name} />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LocationSelector;
