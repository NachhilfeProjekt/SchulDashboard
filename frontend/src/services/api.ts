// frontend/src/services/api.ts
import axios from 'axios';

// API-Basis-URL richtig konfigurieren
// Für die lokale Entwicklung und die Render.com-Bereitstellung
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Axios-Instance mit Basis-URL und Standardeinstellungen
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout erhöhen für langsamere Verbindungen
  timeout: 10000,
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

// User-Anfragen
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    
    // Fallback: Versuche, Benutzerdaten aus dem localStorage zu lesen
    const userData = localStorage.getItem('schul_dashboard_user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data from localStorage', e);
        throw error;
      }
    }
    
    throw error;
  }
};

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
  try {
    const response = await api.get('/locations/user');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user locations', error);
    
    // Fallback: Versuche, Standortdaten aus dem localStorage zu lesen
    const locationsData = localStorage.getItem('schul_dashboard_locations');
    if (locationsData) {
      try {
        return JSON.parse(locationsData);
      } catch (e) {
        console.error('Error parsing locations data from localStorage', e);
      }
    }
    
    // Fallback für den Fall, dass keine Standorte im localStorage vorhanden sind
    // Einfacher Dummy-Standort
    return [
      {
        id: 'default-location',
        name: 'Hauptstandort',
        address: 'Standardadresse',
        isActive: true
      }
    ];
  }
};

export const getAllLocations = async () => {
  try {
    const response = await api.get('/locations');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch all locations', error);
    // Fallback: Leere Liste zurückgeben
    return [];
  }
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
  try {
    const response = await api.post(`/locations/${locationId}/invite`, { email, role });
    return response.data;
  } catch (error) {
    console.error('Failed to invite user to location', error);
    throw error;
  }
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

// Dashboard-Elemente für Benutzer abrufen basierend auf der Rolle
export const getButtonsForUser = async () => {
  try {
    // Versuche, Buttons von der API zu holen
    const response = await api.get('/dashboard/buttons');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard buttons:', error);
    
    // Fallback mit statischen Buttons, wenn API nicht erreichbar ist
    const currentUserData = localStorage.getItem('schul_dashboard_user');
    let currentUser;
    
    try {
      currentUser = currentUserData ? JSON.parse(currentUserData) : null;
    } catch (e) {
      currentUser = { role: 'teacher' }; // Fallback-Rolle
    }
    
    // Basis-Buttons für alle Benutzer
    const baseButtons = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Übersicht über alle wichtigen Informationen',
        icon: 'Dashboard',
        route: '/dashboard',
        color: '#2196f3'
      }
    ];
    
    // Spezifische Buttons je nach Rolle
    let roleSpecificButtons = [];
    
    if (currentUser?.role === 'teacher') {
      roleSpecificButtons = [
        {
          id: 'courses',
          title: 'Meine Kurse',
          description: 'Kurse anzeigen und verwalten',
          icon: 'School',
          route: '/courses',
          color: '#4caf50'
        },
        {
          id: 'calendar',
          title: 'Kalender',
          description: 'Termine und Unterrichtsstunden',
          icon: 'CalendarToday',
          route: '/calendar',
          color: '#ff9800'
        }
      ];
    } else if (currentUser?.role === 'office') {
      roleSpecificButtons = [
        {
          id: 'students',
          title: 'Schülerverwaltung',
          description: 'Schüler hinzufügen, bearbeiten und verwalten',
          icon: 'People',
          route: '/students',
          color: '#ff9800'
        },
        {
          id: 'invoices',
          title: 'Rechnungen',
          description: 'Rechnungsverwaltung und Übersicht',
          icon: 'Receipt',
          route: '/invoices',
          color: '#9c27b0'
        }
      ];
    } else if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
      roleSpecificButtons = [
        {
          id: 'users',
          title: 'Benutzerverwaltung',
          description: 'Benutzer hinzufügen, bearbeiten und verwalten',
          icon: 'People',
          route: '/users',
          color: '#f44336'
        },
        {
          id: 'locations',
          title: 'Standortverwaltung',
          description: 'Standorte verwalten und Benutzer zuweisen',
          icon: 'LocationOn',
          route: '/locations',
          color: '#2196f3'
        },
        {
          id: 'reports',
          title: 'Berichte',
          description: 'Berichte und Statistiken anzeigen',
          icon: 'Assessment',
          route: '/reports',
          color: '#673ab7'
        }
      ];
    } else if (currentUser?.role === 'developer') {
      roleSpecificButtons = [
        {
          id: 'users',
          title: 'Benutzerverwaltung',
          description: 'Benutzer hinzufügen, bearbeiten und verwalten',
          icon: 'People',
          route: '/users',
          color: '#f44336'
        },
        {
          id: 'locations',
          title: 'Standortverwaltung',
          description: 'Standorte verwalten und Benutzer zuweisen',
          icon: 'LocationOn',
          route: '/locations',
          color: '#2196f3'
        },
        {
          id: 'settings',
          title: 'Systemeinstellungen',
          description: 'Globale Systemeinstellungen konfigurieren',
          icon: 'Settings',
          route: '/settings',
          color: '#607d8b'
        }
      ];
    }
    
    return [...baseButtons, ...roleSpecificButtons];
  }
};

// Weitere API-Exporte können hier hinzugefügt werden...

export default api;
