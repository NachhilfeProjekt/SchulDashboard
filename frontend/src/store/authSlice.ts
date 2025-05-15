import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Location } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentLocation: Location | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  currentLocation: null,
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
      localStorage.setItem('token', action.payload.token);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      // Speichere den aktualisierten Benutzer im localStorage
      localStorage.setItem('schul_dashboard_user', JSON.stringify(action.payload));
    },
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
      // Speichere den aktuellen Standort im localStorage
      localStorage.setItem('schul_dashboard_current_location', JSON.stringify(action.payload));
    },
    updateUserLocations: (state, action: PayloadAction<Location[]>) => {
      if (state.user) {
        state.user.locations = action.payload;
        // Aktualisiere den Benutzer im localStorage mit den neuen Standorten
        localStorage.setItem('schul_dashboard_user', JSON.stringify(state.user));
        // Speichere die Standorte separat im localStorage
        localStorage.setItem('schul_dashboard_locations', JSON.stringify(action.payload));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.currentLocation = null;
      // Entferne alle relevanten Einträge aus dem localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('schul_dashboard_token');
      localStorage.removeItem('schul_dashboard_user');
      localStorage.removeItem('schul_dashboard_locations');
      localStorage.removeItem('schul_dashboard_current_location');
    },
  },
});

export const { 
  setCredentials, 
  logout, 
  setCurrentLocation, 
  updateUserLocations,
  updateUser 
} = authSlice.actions;

export default authSlice.reducer;
