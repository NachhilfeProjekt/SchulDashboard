// frontend/src/store/authSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Location } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  locations: Location[];
  currentLocation: Location | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: localStorage.getItem('schul_dashboard_token'),
  user: JSON.parse(localStorage.getItem('schul_dashboard_user') || 'null'),
  locations: JSON.parse(localStorage.getItem('schul_dashboard_locations') || '[]'),
  currentLocation: JSON.parse(localStorage.getItem('schul_dashboard_current_location') || 'null'),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    loginSuccess: (state, action: PayloadAction<{token: string, user: User, locations: Location[]}>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.locations = action.payload.locations;
      state.currentLocation = action.payload.locations[0] || null;
      state.error = null;
      
      // In localStorage speichern
      localStorage.setItem('schul_dashboard_token', action.payload.token);
      localStorage.setItem('schul_dashboard_user', JSON.stringify(action.payload.user));
      localStorage.setItem('schul_dashboard_locations', JSON.stringify(action.payload.locations));
      
      if (action.payload.locations.length > 0) {
        localStorage.setItem('schul_dashboard_current_location', JSON.stringify(action.payload.locations[0]));
      }
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.locations = [];
      state.currentLocation = null;
      
      // Aus localStorage entfernen
      localStorage.removeItem('schul_dashboard_token');
      localStorage.removeItem('schul_dashboard_user');
      localStorage.removeItem('schul_dashboard_locations');
      localStorage.removeItem('schul_dashboard_current_location');
    },
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
      localStorage.setItem('schul_dashboard_current_location', JSON.stringify(action.payload));
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem('schul_dashboard_user', JSON.stringify(action.payload));
    },
  },
});

export const { 
  setLoading, 
  setError, 
  loginSuccess, 
  logout, 
  setCurrentLocation,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;
