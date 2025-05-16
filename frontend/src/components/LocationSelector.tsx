// frontend/src/components/LocationSelector.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { setCurrentLocation, updateUserLocations } from '../store/authSlice';
import { getUserLocations } from '../services/api';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';

const LocationSelector: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fetchAttempts, setFetchAttempts] = useState(0);

  useEffect(() => {
    const fetchLocations = async () => {
      // Vermeiden von endlosen API-Anfragen
      if (loading || error || fetchAttempts > 2) return;
      
      if (user) {
        setLoading(true);
        try {
          const userLocations = await getUserLocations();
          setLocations(userLocations);
          dispatch(updateUserLocations(userLocations));
          
          // Wenn kein aktueller Standort gesetzt ist, aber wir haben Standorte, setze den ersten
          if (!currentLocation && userLocations.length > 0) {
            dispatch(setCurrentLocation(userLocations[0]));
          }
          setError(false);
        } catch (error) {
          console.error('Failed to fetch user locations', error);
          setError(true);
          setFetchAttempts(prev => prev + 1);
          
          // Fallback: Verwende Standorte aus user.locations, wenn verfügbar
          if (user.locations && user.locations.length > 0) {
            setLocations(user.locations);
            // Wenn kein aktueller Standort gesetzt ist, setze den ersten aus user.locations
            if (!currentLocation) {
              dispatch(setCurrentLocation(user.locations[0]));
            }
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLocations();
  }, [user, dispatch, currentLocation, loading, error, fetchAttempts]);

  const handleLocationChange = (event: SelectChangeEvent<string>) => {
    const locationId = event.target.value;
    const selectedLocation = locations.find(loc => loc.id === locationId);
    if (selectedLocation) {
      dispatch(setCurrentLocation(selectedLocation));
    }
  };

  if (!user || locations.length <= 1) {
    return null;
  }

  return (
    <Box sx={{ minWidth: 120, mr: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="location-select-label">Standort</InputLabel>
        <Select
          labelId="location-select-label"
          id="location-select"
          value={currentLocation?.id || ''}
          label="Standort"
          onChange={handleLocationChange}
        >
          {locations.map((location) => (
            <MenuItem key={location.id} value={location.id}>
              {location.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LocationSelector;
