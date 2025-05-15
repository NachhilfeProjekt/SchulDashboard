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
} from '@mui/material';
import { Location } from '../types';

const LocationSelector: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, currentLocation } = useSelector((state: RootState) => state.auth);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (user) {
        try {
          const userLocations = await getUserLocations();
          setLocations(userLocations);
          dispatch(updateUserLocations(userLocations));
          
          // If no current location is set but we have locations, set the first one
          if (!currentLocation && userLocations.length > 0) {
            dispatch(setCurrentLocation(userLocations[0]));
          }
        } catch (error) {
          console.error('Failed to fetch user locations', error);
        }
      }
    };

    fetchLocations();
  }, [user, dispatch, currentLocation]);

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
