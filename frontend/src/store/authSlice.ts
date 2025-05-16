import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Location } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentLocation: Location | null;
  locations: Location[];
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('schul_dashboard_token'),
  isAuthenticated: !!localStorage.getItem('schul_dashboard_token'),
  currentLocation: JSON.parse(localStorage.getItem('schul_dashboard_current_location') || 'null'),
  locations: JSON.parse(localStorage.getItem('schul_dashboard_locations') || '[]') // Diese Zeile hinzufügen
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      // Set default location to the first location in the user's locations if available
      if (action.payload.user.locations && action.payload.user.locations.length > 0) {
        state.currentLocation = action.payload.user.locations[0];
      }
      localStorage.setItem('schul_dashboard_token', action.payload.token);
    },
   loginSuccess: (state, action: PayloadAction<{ user: User; token: string; locations: Location[] }>) => {
  state.user = action.payload.user;
  state.token = action.payload.token;
  state.isAuthenticated = true;
  state.locations = action.payload.locations;
      
      // Setze den Standard-Standort auf den ersten Standort des Benutzers, wenn verfügbar
      if (action.payload.locations && action.payload.locations.length > 0) {
    state.currentLocation = action.payload.locations[0];
  }
      
      // Speichere Daten im localStorage wie in LoginPage erwartet
      localStorage.setItem('schul_dashboard_token', action.payload.token);
  localStorage.setItem('schul_dashboard_user', JSON.stringify(action.payload.user));
  localStorage.setItem('schul_dashboard_locations', JSON.stringify(action.payload.locations || []));
  if (action.payload.locations && action.payload.locations.length > 0) {
    localStorage.setItem('schul_dashboard_current_location', JSON.stringify(action.payload.locations[0]));
  }
},
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
      localStorage.setItem('schul_dashboard_current_location', JSON.stringify(action.payload));
    },
    updateUserLocations: (state, action: PayloadAction<Location[]>) => {
      if (state.user) {
        state.user.locations = action.payload;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.currentLocation = null;
      localStorage.removeItem('schul_dashboard_token');
      localStorage.removeItem('schul_dashboard_user');
      localStorage.removeItem('schul_dashboard_current_location');
    },
  },
});

export const { 
  setCredentials, 
  logout, 
  setCurrentLocation, 
  updateUserLocations,
  updateUser,
  loginSuccess  // Export der loginSuccess-Funktion
} = authSlice.actions;

export default authSlice.reducer;
