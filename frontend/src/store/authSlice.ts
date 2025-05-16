import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, Location } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentLocation: Location | null;
  locations: Location[]; // Locations als Array im State
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('schul_dashboard_token'),
  isAuthenticated: !!localStorage.getItem('schul_dashboard_token'),
  currentLocation: JSON.parse(localStorage.getItem('schul_dashboard_current_location') || 'null'),
  locations: JSON.parse(localStorage.getItem('schul_dashboard_locations') || '[]') // Initialisiere aus localStorage
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Andere reducer...
    
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string; locations: Location[] }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.locations = action.payload.locations; // Speichere Locations explizit im State
      
      // Setze den Standard-Standort auf den ersten Standort, wenn verfügbar
      if (action.payload.locations && action.payload.locations.length > 0) {
        state.currentLocation = action.payload.locations[0];
      }
      
      // Speichere Daten im localStorage
      localStorage.setItem('schul_dashboard_token', action.payload.token);
      localStorage.setItem('schul_dashboard_user', JSON.stringify(action.payload.user));
      localStorage.setItem('schul_dashboard_locations', JSON.stringify(action.payload.locations || []));
      if (action.payload.locations && action.payload.locations.length > 0) {
        localStorage.setItem('schul_dashboard_current_location', JSON.stringify(action.payload.locations[0]));
      }
    },
    
    // Aktualisiere Locations explizit
    updateUserLocations: (state, action: PayloadAction<Location[]>) => {
      state.locations = action.payload;
      localStorage.setItem('schul_dashboard_locations', JSON.stringify(action.payload));
    },
    
    // Bei Logout auch Locations zurücksetzen
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.currentLocation = null;
      state.locations = []; // Locations zurücksetzen
      localStorage.removeItem('schul_dashboard_token');
      localStorage.removeItem('schul_dashboard_user');
      localStorage.removeItem('schul_dashboard_current_location');
      localStorage.removeItem('schul_dashboard_locations');
    },
  },
});
