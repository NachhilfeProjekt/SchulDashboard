// frontend/src/services/api.ts
import axios, { AxiosRequestConfig } from 'axios';

// Konstante für den Token-Schlüssel
export const TOKEN_KEY = 'schul_dashboard_token';

// KORRIGIERTE API-URL - ohne /api am Ende
// const API_URL = import.meta.env.VITE_API_URL || 'https://dashboard-backend-uweg.onrender.com/api';
const BASE_URL = import.meta.env.VITE_API_URL || 'https://dashboard-backend-uweg.onrender.com';
const API_URL = `${BASE_URL}/api`; // Explizite Trennung von Basis-URL und API-Pfad

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
    // Test-URLs (wir versuchen verschiedene Endpunkte)
    const urls = [
      `${API_URL}/test`,             // Standard API-Test
      `${BASE_URL}/health`,          // Health-Check ohne /api
      `${BASE_URL}/api/test`         // Expliziter Test-Pfad
    ];
    
    console.log("Überprüfe API-Verbindung mit folgenden URLs:", urls);
    
    // Versuche jeden Endpunkt nacheinander
    for (const url of urls) {
      try {
        console.log(`Versuche Verbindung zu: ${url}`);
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
        
        if (response.ok) {
          console.log(`✅ Erfolgreiche Verbindung zu: ${url}`);
          
          if (connectionStatus.isOffline) {
            console.log('API-Verbindung wiederhergestellt! Wechsle in Online-Modus.');
            connectionStatus.isOffline = false;
            connectionStatus.connectionAttempts = 0;
            
            // Lösche mögliche ausstehende Reconnect-Timer
            if (connectionStatus.reconnectTimer) {
              clearTimeout(connectionStatus.reconnectTimer);
              connectionStatus.reconnectTimer = null;
            }
            
            // Event auslösen
            window.dispatchEvent(new CustomEvent(CONNECTION_CHANGE_EVENT, { 
              detail: { isOffline: false } 
            }));
          }
          
          return true;
        } else {
          console.log(`❌ Verbindungsfehler zu: ${url} - Status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Verbindungsfehler zu: ${url} - ${error}`);
      }
    }
    
    // Wenn wir hierher gelangen, haben alle Verbindungsversuche fehlgeschlagen
    throw new Error("Alle API-Verbindungsversuche fehlgeschlagen");
  } catch (error) {
    // Nur wenn wir nicht bereits im Offline-Modus sind, wechseln wir und benachrichtigen
    if (!connectionStatus.isOffline) {
      console.warn('API nicht erreichbar. Wechsle in Offline-Modus.', error);
      connectionStatus.isOffline = true;
      
      // Event auslösen
      window.dispatchEvent(new CustomEvent(CONNECTION_CHANGE_EVENT, { 
        detail: { isOffline: true } 
      }));
    }
    
    // Planung des nächsten Verbindungsversuchs mit exponentiellem Backoff
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

// Rest der Datei bleibt unverändert...

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
      if (error.message.includes('Network Error') || error.message.includes('timeout') || error.code === 'ECONNABORTED') {
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

// Rest der Datei bleibt der gleiche wie zuvor...

// UI-Komponente zur Anzeige des Verbindungsstatus registrieren
document.addEventListener('DOMContentLoaded', () => {
  const statusIndicator = document.createElement('div');
  statusIndicator.id = 'connection-status-indicator';
  statusIndicator.style.position = 'fixed';
  statusIndicator.style.bottom = '10px';
  statusIndicator.style.right = '10px';
  statusIndicator.style.padding = '5px 10px';
  statusIndicator.style.borderRadius = '4px';
  statusIndicator.style.fontSize = '12px';
  statusIndicator.style.fontWeight = 'bold';
  statusIndicator.style.zIndex = '9999';
  statusIndicator.style.cursor = 'pointer';
  statusIndicator.style.transition = 'background-color 0.3s ease';
  
  const updateStatus = () => {
    if (connectionStatus.isOffline) {
      statusIndicator.textContent = 'Offline-Modus';
      statusIndicator.style.backgroundColor = '#ff4d4f';
      statusIndicator.style.color = 'white';
    } else {
      statusIndicator.textContent = 'Online';
      statusIndicator.style.backgroundColor = '#52c41a';
      statusIndicator.style.color = 'white';
    }
  };
  
  // Klick-Handler zum manuellen Umschalten
  statusIndicator.addEventListener('click', () => {
    toggleOfflineMode();
    updateStatus();
  });
  
  // Status-Änderungs-Listener
  window.addEventListener(CONNECTION_CHANGE_EVENT, () => {
    updateStatus();
  });
  
  // Initial setzen
  updateStatus();
  
  // Zum Dokument hinzufügen
  document.body.appendChild(statusIndicator);
});

export default api;
