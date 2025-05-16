// frontend/src/services/api.ts - Ergänzungen für verbesserte Fehlerbehandlung
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

// Weitere Funktionen bleiben unverändert...

// Verbesserte Version der getButtonsForUser-Funktion
export const getButtonsForUser = async (locationId: string) => {
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

export default api;
