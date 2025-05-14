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
  token: localStorage.getItem('token'),
  user: null,
  locations: [],
  currentLocation: null,
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
      localStorage.setItem('schul_dashboard_token', action.payload.token);
localStorage.removeItem('schul_dashboard_token');
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.locations = [];
      state.currentLocation = null;
      localStorage.removeItem('token');
    },
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
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
