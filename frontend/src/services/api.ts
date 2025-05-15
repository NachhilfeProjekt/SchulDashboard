// frontend/src/services/api.ts
import axios from 'axios';

// API-Basis-URL aus der Umgebungsvariable oder mit einem Fallback-Wert
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Axios-Instance mit Basis-URL und Standardeinstellungen
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor für das Hinzufügen des Auth-Tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('schul_dashboard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor für Fehlerbehandlung
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Automatische Umleitung bei 401 (Unauthorized) zum Login
    if (error.response && error.response.status === 401) {
      // Lösche Token und User aus dem localStorage
      localStorage.removeItem('schul_dashboard_token');
      localStorage.removeItem('schul_dashboard_user');
      localStorage.removeItem('schul_dashboard_current_location');
      
      // Umleitung zur Login-Seite, wenn nicht bereits dort
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth-Anfragen
export const login = async (email: string, password: string) => {
  return api.post('/auth/login', { email, password });
};

export const register = async (userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  return api.post('/auth/register', userData);
};

export const resetPassword = async (token: string, newPassword: string) => {
  return api.post('/auth/reset-password', { token, newPassword });
};

export const forgotPassword = async (email: string) => {
  return api.post('/auth/forgot-password', { email });
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// Benutzer-Anfragen
export const getUsers = async (filters = {}) => {
  const response = await api.get('/users', { params: filters });
  return response.data;
};

export const getUserById = async (id: string) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id: string, userData: any) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const activateUser = async (id: string) => {
  const response = await api.patch(`/users/${id}/activate`);
  return response.data;
};

export const deactivateUser = async (id: string) => {
  const response = await api.patch(`/users/${id}/deactivate`);
  return response.data;
};

// Standort-Anfragen
export const getUserLocations = async () => {
  const response = await api.get('/locations/user');
  return response.data;
};

export const getAllLocations = async () => {
  const response = await api.get('/locations');
  return response.data;
};

export const getLocationById = async (id: string) => {
  const response = await api.get(`/locations/${id}`);
  return response.data;
};

export const createLocation = async (locationData: any) => {
  const response = await api.post('/locations', locationData);
  return response.data;
};

export const updateLocation = async (id: string, locationData: any) => {
  const response = await api.put(`/locations/${id}`, locationData);
  return response.data;
};

export const deleteLocation = async (id: string) => {
  const response = await api.delete(`/locations/${id}`);
  return response.data;
};

export const activateLocation = async (id: string) => {
  const response = await api.patch(`/locations/${id}/activate`);
  return response.data;
};

export const deactivateLocation = async (id: string) => {
  const response = await api.patch(`/locations/${id}/deactivate`);
  return response.data;
};

// Einladungs-Anfragen
export const inviteUserToLocation = async (locationId: string, email: string, role: string) => {
  const response = await api.post(`/locations/${locationId}/invite`, { email, role });
  return response.data;
};

export const acceptLocationInvitation = async (invitationToken: string) => {
  const response = await api.post('/locations/invitations/accept', { token: invitationToken });
  return response.data;
};

export const getLocationInvitations = async (locationId: string) => {
  const response = await api.get(`/locations/${locationId}/invitations`);
  return response.data;
};

export const getUserInvitations = async () => {
  const response = await api.get('/users/me/invitations');
  return response.data;
};

export const revokeInvitation = async (invitationId: string) => {
  const response = await api.delete(`/invitations/${invitationId}`);
  return response.data;
};

// Weitere API-Funktionen nach Bedarf...

export default api;
