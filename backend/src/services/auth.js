// frontend/src/services/auth.js
import axios from 'axios';
import { loginSuccess } from '../store/authSlice';

// Konstanten
const TOKEN_KEY = 'schul_dashboard_token';
const USER_KEY = 'schul_dashboard_user';
const LOCATIONS_KEY = 'schul_dashboard_locations';

// API URLs zum Testen
const API_URLS = [
  'https://dashboard-backend-uweg.onrender.com/api',
  'https://dashboard-backend-uweg.onrender.com',
  'https://dashboard-backend-uweg.onrender.com/health'
];

// Funktion zum Testen, welche URL funktioniert
export const findWorkingBackendUrl = async () => {
  for (const url of API_URLS) {
    try {
      // Versuch mit axios
      const response = await axios.get(`${url.includes('/health') ? url : `${url}/health`}`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        console.log(`Funktionierende Backend-URL gefunden: ${url}`);
        
        // Entferne "/health" wenn nötig
        const baseUrl = url.includes('/health') ? url.replace('/health', '') : url;
        return baseUrl;
      }
    } catch (error) {
      console.warn(`URL ${url} nicht erreichbar`);
    }
  }
  
  // Keine funktionierende URL gefunden
  console.error('Keine funktionierende Backend-URL gefunden. Wechsle in den Offline-Modus.');
  return null;
};

// Funktion zum Login
export const attemptLogin = async (email, password, dispatch) => {
  try {
    // Versuche zuerst, eine funktionierende Backend-URL zu finden
    const baseUrl = await findWorkingBackendUrl();
    
    // Wenn eine funktionierende URL gefunden wurde, versuche den regulären Login
    if (baseUrl) {
      try {
        const response = await axios.post(`${baseUrl}/auth/login`, {
          email,
          password
        });
        
        if (response.data && response.data.token) {
          // Login erfolgreich
          const { token, user, locations } = response.data;
          
          // Daten im LocalStorage speichern
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations || []));
          
          // Redux aktualisieren
          dispatch(loginSuccess({
            token,
            user,
            locations: locations || []
          }));
          
          return { success: true, message: 'Login erfolgreich' };
        }
      } catch (loginError) {
        console.error('Login-Fehler:', loginError);
        
        // Wenn Login fehlschlägt, prüfe, ob es an den Zugangsdaten liegt
        if (loginError.response && loginError.response.status === 401) {
          return { 
            success: false, 
            message: 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre E-Mail und Passwort.' 
          };
        }
      }
    }
    
    // Wenn keine URL funktioniert oder der Login fehlschlägt, verwende Offline-Modus
    // Aber nur, wenn die Anmeldedaten admin@example.com/admin123 sind
    if (email === 'admin@example.com' && password === 'admin123') {
      console.log('Verwende Offline-Login mit Standard-Anmeldedaten');
      
      // Mock-Daten
      const mockToken = 'mock-token-123';
      const mockUser = {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@example.com',
        role: 'developer',
        createdAt: new Date().toISOString()
      };
      const mockLocations = [
        { id: 'loc-1', name: 'Hauptstandort', createdAt: new Date().toISOString() }
      ];
      
      // Daten im LocalStorage speichern
      localStorage.setItem(TOKEN_KEY, mockToken);
      localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem(LOCATIONS_KEY, JSON.stringify(mockLocations));
      
      // Redux aktualisieren
      dispatch(loginSuccess({
        token: mockToken,
        user: mockUser,
        locations: mockLocations
      }));
      
      return { 
        success: true, 
        message: 'Offline-Modus aktiviert. Sie haben eingeschränkte Funktionalität.',
        offlineMode: true
      };
    }
    
    return { 
      success: false, 
      message: 'Anmeldung fehlgeschlagen. Server nicht erreichbar und Offline-Modus nur mit Standard-Zugangsdaten verfügbar.'
    };
  } catch (error) {
    console.error('Unerwarteter Fehler:', error);
    return { 
      success: false, 
      message: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.'
    };
  }
};

// Funktion zum Ausloggen
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LOCATIONS_KEY);
};
