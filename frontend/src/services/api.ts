// frontend/src/services/api.ts
import axios, { AxiosRequestConfig } from 'axios';

// Konstante für den Token-Schlüssel
export const TOKEN_KEY = 'schul_dashboard_token';

// KORRIGIERTE API-URL
const BASE_URL = 'https://cors-anywhere.herokuapp.com/https://dashboard-backend-uweg.onrender.com/api';
// Verwende BASE_URL direkt ohne /api anzuhängen
const API_URL = BASE_URL;
// Extrahiere die Basis-URL ohne /api für API-Checks
const BASE_URL_WITHOUT_API = BASE_URL.replace(/\/api$/, '');

// Verbindungsstatus-Objekt
export const connectionStatus = {
  isOffline: false,
  lastOnlineCheck: 0,
  connectionAttempts: 0,
  reconnectTimer: null as NodeJS.Timeout | null,
  maxReconnectInterval: 60000, // 1 Minute maximale Wartezeit
  checkInterval: 30000, // 30 Sekunden zwischen Statusprüfungen
};

// Event für Statusänderungen
export const CONNECTION_CHANGE_EVENT = 'dashboard_connection_change';

// Initialisiere Axios mit Basiskonfiguration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 Sekunden Timeout für alle Anfragen
});

// Hilfsfunktionen für den Offline-Modus
export const isOfflineLocation = (locationId: string): boolean => {
  // WICHTIG: Deaktivieren der Offline-Prüfung basierend auf Standort-ID
  // Wir prüfen nur die aktuelle Verbindung, nicht den Standort
  // return locationId === 'default-location' || (locationId && locationId.toLowerCase().includes('offline'));
  return false; // Immer Online-Modus für Standorte
};

export const isOfflineMode = (): boolean => {
  // Direkter Zugriff auf den Verbindungsstatus, statt lokale Indikatoren zu prüfen
  return connectionStatus.isOffline;
};

// Verbindungsstatus prüfen
export const checkApiConnection = async (): Promise<boolean> => {
  const now = Date.now();
  connectionStatus.lastOnlineCheck = now;
  
  try {
    // Statt dem nicht existierenden Health-Endpunkt einen bekannten API-Endpunkt verwenden
    // Versuche einen API-Endpunkt, der wahrscheinlich existiert (z.B. für Login)
    const apiCheckURL = `${API_URL}/auth/login`;
    
    console.log("Prüfe Verbindung zum Backend...", apiCheckURL);
    
    // Verbindungsprüfung mit manuellem Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(apiCheckURL, { 
        method: 'HEAD',  // HEAD-Anfrage ist effizient für Verbindungsprüfungen
        headers: { 'Cache-Control': 'no-cache' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Auch 404 ist OK - bedeutet, dass der Server erreicht wurde,
      // auch wenn der spezifische Endpunkt nicht existiert
      if (response.ok || response.status === 404) {
        console.log(`✅ Backend erreichbar (Status: ${response.status})`);
        
        if (connectionStatus.isOffline) {
          console.log('Verbindung wiederhergestellt! Wechsle in Online-Modus.');
          connectionStatus.isOffline = false;
          connectionStatus.connectionAttempts = 0;
          
          if (connectionStatus.reconnectTimer) {
            clearTimeout(connectionStatus.reconnectTimer);
            connectionStatus.reconnectTimer = null;
          }
          
          window.dispatchEvent(new CustomEvent(CONNECTION_CHANGE_EVENT, { 
            detail: { isOffline: false } 
          }));
        }
        
        return true;
      } else {
        throw new Error(`Backend antwortet mit Status: ${response.status}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error("Verbindungsfehler:", error);
    
    if (!connectionStatus.isOffline) {
      console.warn('Backend nicht erreichbar. Wechsle in Offline-Modus.');
      connectionStatus.isOffline = true;
      
      window.dispatchEvent(new CustomEvent(CONNECTION_CHANGE_EVENT, { 
        detail: { isOffline: true } 
      }));
    }
    
    scheduleReconnect();
    return false;
  }
};

// Plant den nächsten Wiederverbindungsversuch
export const scheduleReconnect = (): void => {
  // Bereits geplanten Timer löschen
  if (connectionStatus.reconnectTimer) {
    clearTimeout(connectionStatus.reconnectTimer);
  }
  
  // Berechnen der Wartezeit mit exponentiellem Backoff
  connectionStatus.connectionAttempts++;
  const baseDelay = 1000; // 1 Sekunde
  const factor = Math.min(2 ** connectionStatus.connectionAttempts, 60); // Max. 60x der Basiszeit
  const delay = Math.min(baseDelay * factor, connectionStatus.maxReconnectInterval);
  
  console.log(`Nächster Verbindungsversuch in ${delay/1000} Sekunden...`);
  
  // Timer setzen
  connectionStatus.reconnectTimer = setTimeout(() => {
    checkApiConnection();
  }, delay);
};

// Periodische Verbindungsprüfung starten
const startConnectionCheck = () => {
  // Initial einmal prüfen
  checkApiConnection();
  
  // Regelmäßig prüfen
  setInterval(() => {
    // Nur prüfen, wenn wir offline sind oder der letzte Check länger her ist
    const now = Date.now();
    if (connectionStatus.isOffline || (now - connectionStatus.lastOnlineCheck > connectionStatus.checkInterval)) {
      checkApiConnection();
    }
  }, connectionStatus.checkInterval);
};

// Sofort mit der Verbindungsprüfung beginnen
startConnectionCheck();

// Füge Logging für das API-URL hinzu
console.log('BASE_URL:', BASE_URL);
console.log('API_URL:', API_URL);
console.log('API-Check URL:', `${API_URL}/auth/login`);

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
    
    // Bei erfolgreicher Antwort sicherstellen, dass wir im Online-Modus sind
    if (connectionStatus.isOffline) {
      checkApiConnection();
    }
    
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
      
      // Netzwerkfehler - Offline-Modus aktivieren
      if (error.message?.includes('Network Error') || error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
        console.log('Netzwerkfehler - Aktiviere Offline-Modus');
        checkApiConnection(); // Dies wird den Offline-Modus aktivieren und Reconnect planen
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

// ALLE API-FUNKTIONEN

// Funktion zum Abrufen des aktuellen Benutzers
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    throw error;
  }
};

// Funktion zum Abrufen der Standorte eines Benutzers
export const getUserLocations = async () => {
  try {
    const response = await api.get('/users/locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching user locations:', error);
    throw error;
  }
};

// Weitere Funktionen
export const getLocations = async () => {
  try {
    const response = await api.get('/locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

export const createLocation = async (name: string) => {
  try {
    const response = await api.post('/locations', { name });
    return response.data;
  } catch (error) {
    console.error('Error creating location:', error);
    throw error;
  }
};

export const deleteLocation = async (id: string) => {
  try {
    const response = await api.delete(`/locations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
};

export const createUser = async (email: string, role: string, locationIds: string[]) => {
  try {
    const response = await api.post('/users', { email, role, locationIds });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getButtonsForUser = async (locationId: string) => {
  try {
    const response = await api.get(`/buttons/location/${locationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching buttons:', error);
    throw error;
  }
};

export const acceptLocationInvitation = async (token: string, password: string) => {
  try {
    const response = await api.post('/invitations/accept', { token, password });
    return response.data;
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
};

export const getUsersByLocation = async (locationId: string) => {
  try {
    const response = await api.get(`/users/location/${locationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users by location:', error);
    throw error;
  }
};

export const deactivateUser = async (userId: string) => {
  try {
    const response = await api.post(`/users/${userId}/deactivate`);
    return response.data;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getDeactivatedUsers = async () => {
  try {
    const response = await api.get('/users/deactivated');
    return response.data;
  } catch (error) {
    console.error('Error fetching deactivated users:', error);
    throw error;
  }
};

export const reactivateUser = async (userId: string) => {
  try {
    const response = await api.post(`/users/${userId}/reactivate`);
    return response.data;
  } catch (error) {
    console.error('Error reactivating user:', error);
    throw error;
  }
};

export const inviteUserToLocation = async (userId: string, locationId: string, role?: string) => {
  try {
    const data = role ? { userId, locationId, role } : { userId, locationId };
    const response = await api.post('/invitations', data);
    return response.data;
  } catch (error) {
    console.error('Error inviting user to location:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};

export const createCustomButton = async (name: string, url: string, locationId: string) => {
  try {
    const response = await api.post('/buttons', { name, url, locationId });
    return response.data;
  } catch (error) {
    console.error('Error creating button:', error);
    throw error;
  }
};

export const setButtonPermissions = async (buttonId: string, permissions: any) => {
  try {
    const response = await api.post(`/buttons/${buttonId}/permissions`, permissions);
    return response.data;
  } catch (error) {
    console.error('Error setting button permissions:', error);
    throw error;
  }
};

export const deleteButton = async (buttonId: string) => {
  try {
    const response = await api.delete(`/buttons/${buttonId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting button:', error);
    throw error;
  }
};

export const getEmailTemplates = async (locationId: string) => {
  try {
    const response = await api.get(`/email-templates/location/${locationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }
};

export const sendBulkEmails = async (templateId: string, recipients: any[]) => {
  try {
    const response = await api.post('/emails/bulk', { templateId, recipients });
    return response.data;
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    throw error;
  }
};

export const getSentEmails = async (locationId: string) => {
  try {
    const response = await api.get(`/emails/sent/location/${locationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sent emails:', error);
    throw error;
  }
};

export const resendFailedEmails = async (emailIds: string[]) => {
  try {
    const response = await api.post('/emails/resend', { emailIds });
    return response.data;
  } catch (error) {
    console.error('Error resending failed emails:', error);
    throw error;
  }
};

export const getUserActivityLog = async (userId: string) => {
  try {
    const response = await api.get(`/users/${userId}/activity-log`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user activity log:', error);
    throw error;
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    const response = await api.post('/auth/request-password-reset', { email });
    return response.data;
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// API-Instanz exportieren
export default api;
