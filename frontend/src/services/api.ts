// frontend/src/services/api.ts
import axios, { AxiosRequestConfig } from 'axios';

// Konstante für den Token-Schlüssel
export const TOKEN_KEY = 'schul_dashboard_token';

// API-URL aus .env oder fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://dashboard-backend-uweg.onrender.com/api';

// Initialisiere Axios mit Basiskonfiguration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 Sekunden Timeout für alle Anfragen
});

// Hilfsfunktionen für den Offline-Modus
const isOfflineLocation = (locationId: string): boolean => {
  return locationId === 'default-location' || (locationId && locationId.toLowerCase().includes('offline'));
};

const isOfflineMode = (): boolean => {
  const currentLocation = JSON.parse(localStorage.getItem('schul_dashboard_current_location') || 'null');
  return !currentLocation || 
         isOfflineLocation(currentLocation?.id) || 
         (currentLocation?.name && currentLocation.name.toLowerCase().includes('offline'));
};

// Füge Logging für das API-URL hinzu
console.log('API URL:', API_URL);

// Request Interceptor für das Hinzufügen des Tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Debug-Info
  console.log(`API-Anfrage: ${config.method?.toUpperCase()} ${config.url}`);
  
  return config;
});

// Response Interceptor für bessere Fehlerbehandlung
api.interceptors.response.use(
  (response) => {
    // Debug-Info
    console.log(`API-Antwort: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    // Verbesserte Fehlerbehandlung
    if (error.response) {
      // Der Server hat geantwortet mit einem Statuscode außerhalb des 2xx-Bereichs
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
      
      // 401-Fehler (Unauthorized) -> automatisches Logout
      if (error.response.status === 401) {
        console.log('401 Unauthorized - Auto-Logout');
        
        // Falls die Anfrage nicht an den Login-Endpunkt ging, führen wir ein Logout durch
        if (!error.config.url?.includes('/auth/login')) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('schul_dashboard_user');
          localStorage.removeItem('schul_dashboard_locations');
          localStorage.removeItem('schul_dashboard_current_location');
          
          // Seite nur neu laden, wenn wir uns nicht bereits auf der Login-Seite befinden
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?session_expired=true';
          }
        }
      }
    } else if (error.request) {
      // Die Anfrage wurde gestellt, aber keine Antwort erhalten
      console.error('API Error Request:', {
        request: error.request,
        url: error.config?.url
      });
      
      // Netzwerkfehler - Offline-Modus?
      if (error.message.includes('Network Error')) {
        console.log('Netzwerkfehler - Offline-Modus könnte aktiviert werden');
        // Hier könnte ein Event für den Offline-Modus ausgelöst werden
      }
    } else {
      // Beim Einrichten der Anfrage ist ein Fehler aufgetreten
      console.error('API Error Setup:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Timeout für API-Anfragen erhöhen
api.defaults.timeout = 30000; // 30 Sekunden

// Authentifizierung
export const login = async (email: string, password: string) => {
  try {
    console.log('Sending login request to:', `${API_URL}/auth/login`);
    const response = await api.post('/auth/login', { email, password });
    console.log('Login response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const requestPasswordReset = async (email: string) => {
  const response = await api.post('/auth/request-password-reset', { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

// Benutzer
export const createUser = async (email: string, role: string, locations: string[]) => {
  const response = await api.post('/auth/create-user', { email, role, locations });
  return response.data;
};

export const getCurrentUser = async () => {
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, verwende Offline-Benutzerdaten');
    return {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@example.com',
      role: 'developer',
      is_active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  try {
    const response = await api.get('/auth/current-user');
    return response.data.user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    
    // Fallback für Offline-Modus
    if (localStorage.getItem('schul_dashboard_user')) {
      return JSON.parse(localStorage.getItem('schul_dashboard_user') || '{}');
    }
    
    // Wenn kein User im localStorage, werfen wir den Fehler weiter
    throw error;
  }
};

export const getUsersByLocation = async (locationId: string) => {
  if (isOfflineLocation(locationId)) {
    console.log('Offline-Standort erkannt, verwende Mock-Benutzerdaten');
    return [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@example.com',
        role: 'developer',
        is_active: true
      }
    ];
  }
  
  const response = await api.get(`/users/location/${locationId}`);
  return response.data;
};

// Standorte
export const getLocations = async () => {
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, verwende Mock-Standortdaten');
    return [{
      id: 'default-location',
      name: 'Hauptstandort (Offline)',
      address: 'Offline-Modus - Keine Verbindung zum Server',
      isActive: true
    }];
  }
  
  try {
    const response = await api.get('/locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    
    // Fallback für Fehler
    return [{
      id: 'default-location',
      name: 'Hauptstandort (Offline)',
      address: 'Offline-Modus - Keine Verbindung zum Server',
      isActive: true
    }];
  }
};

export const getAllLocations = async () => {
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, verwende Mock-Standortdaten');
    return [{
      id: 'default-location',
      name: 'Hauptstandort (Offline)',
      address: 'Offline-Modus - Keine Verbindung zum Server',
      isActive: true
    }];
  }
  
  try {
    const response = await api.get('/locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching all locations:', error);
    
    // Fallback für Fehler
    return [{
      id: 'default-location',
      name: 'Hauptstandort (Offline)',
      address: 'Offline-Modus - Keine Verbindung zum Server',
      isActive: true
    }];
  }
};

export const getUserLocations = async () => {
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, verwende Fallback-Standortdaten');
    return [{
      id: 'default-location',
      name: 'Hauptstandort (Offline)',
      address: 'Offline-Modus - Keine Verbindung zum Server',
      isActive: true
    }];
  }
  
  try {
    const response = await api.get('/locations/my-locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching user locations:', error);
    
    // Fallback für Fehler oder fehlenden Endpunkt
    if (error.response && (error.response.status === 404 || error.response.status === 500)) {
      console.log('Endpunkt nicht verfügbar oder Serverfehler, verwende Fallback-Daten');
      return [{
        id: 'default-location',
        name: 'Hauptstandort (Offline)',
        address: 'Offline-Modus - Keine Verbindung zum Server',
        isActive: true
      }];
    }
    
    // Wenn es ein anderer Fehler ist und wir Locations im localStorage haben
    const locationsFromStorage = JSON.parse(localStorage.getItem('schul_dashboard_locations') || '[]');
    if (locationsFromStorage.length > 0) {
      return locationsFromStorage;
    }
    
    // Sonst Standardwert
    return [{
      id: 'default-location',
      name: 'Hauptstandort (Offline)',
      address: 'Offline-Modus - Keine Verbindung zum Server',
      isActive: true
    }];
  }
};

export const createLocation = async (name: string) => {
  const response = await api.post('/locations', { name });
  return response.data;
};

export const deleteLocation = async (locationId: string) => {
  const response = await api.delete(`/locations/${locationId}`);
  return response.data;
};

// Invitations
export const inviteUserToLocation = async (userId: string, locationId: string) => {
  const response = await api.post('/users/invite', { userId, locationId });
  return response.data;
};

export const acceptLocationInvitation = async (token: string, password: string) => {
  const response = await api.post('/locations/accept-invitation', { token, password });
  return response.data;
};

// Buttons
export const getButtonsForUser = async (locationId: string) => {
  // Prüfe zuerst auf Offline-Modus oder Offline-Standort
  if (isOfflineMode() || isOfflineLocation(locationId)) {
    console.log(`Offline-Modus oder Offline-Standort ${locationId} erkannt, verwende Fallback-Button-Daten`);
    return [{
      id: 'fallback-button-1',
      name: 'Test-Button (Offline-Modus)',
      url: 'https://example.com',
      location_id: locationId,
      created_by: 'system',
      created_at: new Date().toISOString()
    }];
  }

  try {
    console.log('Button-Anfrage wird gesendet...');
    
    // Maximale Anzahl von Versuchen
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;
    
    while (retryCount < maxRetries) {
      try {
        const response = await api.get(`/buttons/location/${locationId}`);
        console.log('Button-Antwort:', response.data);
        return response.data;
      } catch (error) {
        lastError = error;
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Exponentielles Backoff für Wiederholungsversuche
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Versuch ${retryCount} fehlgeschlagen. Erneuter Versuch in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Alle Versuche fehlgeschlagen
    console.error('Alle Versuche zum Abrufen der Buttons fehlgeschlagen:', lastError);
    
    // Fallback für Entwicklungs- oder Testzwecke
    return [{
      id: 'fallback-button-1',
      name: 'Test-Button (Fallback)',
      url: 'https://example.com',
      location_id: locationId,
      created_by: 'system',
      created_at: new Date().toISOString()
    }];
  } catch (error) {
    console.error('Fehler beim Abrufen der Buttons:', error);
    // Fallback für Entwicklungs- oder Testzwecke
    return [{
      id: 'fallback-button-1',
      name: 'Test-Button (Fallback)',
      url: 'https://example.com',
      location_id: locationId,
      created_by: 'system',
      created_at: new Date().toISOString()
    }];
  }
};

export const createCustomButton = async (name: string, url: string, locationId: string) => {
  // Im Offline-Modus simulieren wir eine erfolgreiche Erstellung
  if (isOfflineMode() || isOfflineLocation(locationId)) {
    console.log('Offline-Modus erkannt, simuliere Button-Erstellung');
    return {
      id: `offline-button-${Date.now()}`,
      name,
      url,
      location_id: locationId,
      created_by: JSON.parse(localStorage.getItem('schul_dashboard_user') || '{}')?.id || 'offline-user',
      created_at: new Date().toISOString()
    };
  }
  
  const response = await api.post('/buttons', { name, url, locationId });
  return response.data;
};

export const setButtonPermissions = async (buttonId: string, permissions: {roles?: string[], users?: string[]}) => {
  // Im Offline-Modus simulieren wir eine erfolgreiche Berechtigungsaktualisierung
  if (isOfflineMode() || buttonId.includes('offline') || buttonId.includes('fallback')) {
    console.log('Offline-Modus oder Offline-Button erkannt, simuliere Berechtigungsaktualisierung');
    return { message: 'Berechtigungen erfolgreich aktualisiert (Offline-Modus)' };
  }
  
  const response = await api.post(`/buttons/${buttonId}/permissions`, { permissions });
  return response.data;
};

export const deleteButton = async (buttonId: string) => {
  // Im Offline-Modus simulieren wir eine erfolgreiche Löschung
  if (isOfflineMode() || buttonId.includes('offline') || buttonId.includes('fallback')) {
    console.log('Offline-Modus oder Offline-Button erkannt, simuliere Button-Löschung');
    return { message: 'Button erfolgreich gelöscht (Offline-Modus)' };
  }
  
  const response = await api.delete(`/buttons/${buttonId}`);
  return response.data;
};

// E-Mails
export const getEmailTemplates = async (locationId: string) => {
  // Im Offline-Modus oder für Offline-Standorte simulieren wir E-Mail-Vorlagen
  if (isOfflineMode() || isOfflineLocation(locationId)) {
    console.log('Offline-Modus erkannt, verwende Mock-E-Mail-Vorlagen');
    return [
      {
        id: 'mock-template-1',
        name: 'Willkommens-E-Mail',
        subject: 'Willkommen im System',
        body: 'Hallo {{name}}, willkommen im System!',
        locationId: locationId,
        created_by: 'system',
        created_at: new Date().toISOString()
      }
    ];
  }
  
  try {
    const response = await api.get(`/emails/templates/location/${locationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    // Fallback für Fehler
    if (error.response && (error.response.status === 404 || error.response.status === 500)) {
      console.log('Endpunkt nicht verfügbar, verwende Mock-Daten für E-Mail-Vorlagen');
      return [
        {
          id: 'mock-template-1',
          name: 'Willkommens-E-Mail',
          subject: 'Willkommen im System',
          body: 'Hallo {{name}}, willkommen im System!',
          locationId: locationId,
          created_by: 'system',
          created_at: new Date().toISOString()
        }
      ];
    }
    throw error;
  }
};

export const getSentEmails = async (locationId: string) => {
  // Im Offline-Modus simulieren wir leere gesendete E-Mails
  if (isOfflineMode() || isOfflineLocation(locationId)) {
    console.log('Offline-Modus erkannt, verwende leere E-Mail-Liste');
    return [];
  }
  
  try {
    const response = await api.get(`/emails/sent?locationId=${locationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    if (error.response && error.response.status === 404) {
      return [];
    }
    throw error;
  }
};

export const sendBulkEmails = async (templateId: string, recipients: Array<{ email: string, name: string }>) => {
  // Im Offline-Modus simulieren wir einen erfolgreichen E-Mail-Versand
  if (isOfflineMode() || templateId.includes('mock')) {
    console.log('Offline-Modus erkannt, simuliere E-Mail-Versand');
    return { message: 'E-Mails werden versendet (Simulation im Offline-Modus).' };
  }
  
  try {
    const response = await api.post('/emails/send-bulk', { templateId, recipients });
    return response.data;
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    if (error.response && (error.response.status === 404 || error.response.status === 500)) {
      return { message: 'E-Mails werden versendet (Simulation).' };
    }
    throw error;
  }
};

export const resendFailedEmails = async (emailIds: string[]) => {
  // Im Offline-Modus simulieren wir einen erfolgreichen E-Mail-Versand
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, simuliere erneuten E-Mail-Versand');
    return { message: 'E-Mails werden erneut gesendet (Simulation im Offline-Modus).' };
  }
  
  try {
    const response = await api.post('/emails/resend', { emailIds });
    return response.data;
  } catch (error) {
    console.error('Error resending emails:', error);
    if (error.response && error.response.status === 404) {
      return { message: 'E-Mails werden erneut gesendet (Simulation).' };
    }
    throw error;
  }
};

// Benutzerverwaltung
export const deactivateUser = async (userId: string) => {
  // Im Offline-Modus simulieren wir eine erfolgreiche Deaktivierung
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, simuliere Benutzer-Deaktivierung');
    return { message: 'Benutzer erfolgreich deaktiviert (Offline-Modus)' };
  }
  
  const response = await api.post(`/users/${userId}/deactivate`);
  return response.data;
};

export const reactivateUser = async (userId: string) => {
  // Im Offline-Modus simulieren wir eine erfolgreiche Reaktivierung
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, simuliere Benutzer-Reaktivierung');
    return { message: 'Benutzer erfolgreich reaktiviert (Offline-Modus)' };
  }
  
  const response = await api.post(`/users/${userId}/reactivate`);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  // Im Offline-Modus simulieren wir eine erfolgreiche Löschung
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, simuliere Benutzer-Löschung');
    return { message: 'Benutzer erfolgreich gelöscht (Offline-Modus)' };
  }
  
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

export const getDeactivatedUsers = async () => {
  // Im Offline-Modus simulieren wir eine leere Liste deaktivierter Benutzer
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, verwende leere Liste deaktivierter Benutzer');
    return [];
  }
  
  const response = await api.get('/users/deactivated');
  return response.data;
};

export const getUserActivityLog = async (userId: string) => {
  // Im Offline-Modus simulieren wir ein leeres Aktivitätsprotokoll
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, verwende leeres Aktivitätsprotokoll');
    return [];
  }
  
  const response = await api.get(`/users/${userId}/activity-log`);
  return response.data;
};

export const getAllUsers = async () => {
  // Im Offline-Modus simulieren wir eine Liste mit dem Administrator
  if (isOfflineMode()) {
    console.log('Offline-Modus erkannt, verwende Mock-Benutzerliste');
    return [{
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@example.com',
      role: 'developer',
      is_active: true,
      locations: [{
        id: 'default-location',
        name: 'Hauptstandort (Offline)'
      }]
    }];
  }
  
  const response = await api.get('/users/all');
  return response.data;
};

export const getUserById = async (id: string) => {
  // Im Offline-Modus oder für den Administrator im Offline-Modus
  if (isOfflineMode() || id === '11111111-1111-1111-1111-111111111111') {
    console.log('Offline-Modus erkannt, verwende Mock-Benutzerdaten');
    return {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@example.com',
      role: 'developer',
      is_active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      locations: [{
        id: 'default-location',
        name: 'Hauptstandort (Offline)'
      }]
    };
  }
  
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export default api;
