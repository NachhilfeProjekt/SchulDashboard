import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { setCurrentLocation } from '../store/authSlice';
import { MenuItem, Select, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';

const LocationSelector: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { locations, currentLocation } = useSelector((state: RootState) => state.auth);

  const handleChange = (event: SelectChangeEvent) => {
    const selectedLocation = locations.find(loc => loc.id === event.target.value);
    if (selectedLocation) {
      dispatch(setCurrentLocation(selectedLocation));
    }
  };

  if (locations.length <= 1) return null;

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel id="location-select-label">Standort</InputLabel>
      <Select
        labelId="location-select-label"
        value={currentLocation?.id || ''}
        label="Standort"
        onChange={handleChange}
      >
        {locations.map((location) => (
          <MenuItem key={location.id} value={location.id}>
            {location.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default LocationSelector;