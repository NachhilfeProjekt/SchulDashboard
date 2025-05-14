// frontend/src/services/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { User, Location } from '../types';

// API-Basis-URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dashboard-backend-uweg.onrender.com/api';
const OFFLINE_MODE_KEY = 'dashboard_offline_mode';

// Lokaler Speicher-Keys
const TOKEN_KEY = 'schul_dashboard_token';
const USER_KEY = 'schul_dashboard_user';
const LOCATIONS_KEY = 'schul_dashboard_locations';

class ApiService {
  private instance: AxiosInstance;
  private offlineMode: boolean;

  constructor() {
    // Prüfen, ob der Offline-Modus aktiv ist
    this.offlineMode = localStorage.getItem(OFFLINE_MODE_KEY) === 'true';
    
    console.log(`API Service initialisiert mit URL: ${API_BASE_URL}, Offline-Modus: ${this.offlineMode}`);
    
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request-Interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Token hinzufügen, wenn vorhanden
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Wenn im Offline-Modus, Request abbrechen und Error werfen
        if (this.offlineMode) {
          return Promise.reject(new Error('Offline-Modus aktiv'));
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response-Interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Bei Netzwerk- oder Timeout-Fehlern in den Offline-Modus wechseln
        if (!error.response || error.code === 'ECONNABORTED') {
          console.warn('Netzwerkfehler erkannt, wechsle in den Offline-Modus');
          this.enableOfflineMode();
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Offline-Modus aktivieren
  public enableOfflineMode() {
    this.offlineMode = true;
    localStorage.setItem(OFFLINE_MODE_KEY, 'true');
    console.log('Offline-Modus aktiviert');
  }

  // Offline-Modus deaktivieren
  public disableOfflineMode() {
    this.offlineMode = false;
    localStorage.setItem(OFFLINE_MODE_KEY, 'false');
    console.log('Offline-Modus deaktiviert');
  }

  // Prüfen, ob Offline-Modus aktiv ist
  public isOfflineMode() {
    return this.offlineMode;
  }

  // API-Methoden mit Offline-Fallback
  
  // Login
  public async login(email: string, password: string) {
    // Im Offline-Modus spezielle Behandlung für Standard-Benutzer
    if (this.offlineMode || email === 'admin@example.com' && password === 'admin123') {
      try {
        // Versuche Online-Login
        if (!this.offlineMode) {
          const response = await this.instance.post('/auth/login', { email, password });
          return response.data;
        }
      } catch (error) {
        // Bei Fehler: Verwende Offline-Login für Standard-Benutzer
        if (email === 'admin@example.com' && password === 'admin123') {
          console.log('Fallback auf Offline-Login');
          this.enableOfflineMode();
        } else {
          throw error;
        }
      }
      
      // Wenn Offline-Modus und Standard-Benutzer, erstelle Mock-Daten
      if (this.offlineMode && email === 'admin@example.com' && password === 'admin123') {
        console.log('Verwende Offline-Login mit Standard-Anmeldedaten');
        
        const mockData = {
          token: 'mock-token-dashboard',
          user: {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'admin@example.com',
            role: 'developer',
            createdAt: new Date().toISOString()
          },
          locations: [
            {
              id: '22222222-2222-2222-2222-222222222222',
              name: 'Hauptstandort',
              createdAt: new Date().toISOString()
            }
          ]
        };
        
        // Speichere Mock-Daten lokal
        localStorage.setItem(TOKEN_KEY, mockData.token);
        localStorage.setItem(USER_KEY, JSON.stringify(mockData.user));
        localStorage.setItem(LOCATIONS_KEY, JSON.stringify(mockData.locations));
        
        return mockData;
      }
    }
    
    // Standard Online-Login
    const response = await this.instance.post('/auth/login', { email, password });
    return response.data;
  }

  // Teste die Verbindung zum Backend
  public async testConnection() {
    try {
      // Versuche verschiedene URLs
      const urls = [
        `${API_BASE_URL}/health`,
        API_BASE_URL.replace('/api', '/health'),
        'https://dashboard-backend-uweg.onrender.com/health'
      ];
      
      for (const url of urls) {
        try {
          const response = await axios.get(url, { timeout: 5000 });
          if (response.status === 200) {
            console.log(`Verbindung erfolgreich zu ${url}`);
            this.disableOfflineMode();
            return true;
          }
        } catch (err) {
          console.warn(`Verbindung fehlgeschlagen zu ${url}`);
        }
      }
      
      // Wenn keine URL funktioniert hat
      this.enableOfflineMode();
      return false;
    } catch (error) {
      console.error('Verbindungstest fehlgeschlagen:', error);
      this.enableOfflineMode();
      return false;
    }
  }
  
  // Weitere API-Methoden würden hier folgen...
  // ...
}

// Erstelle eine Singleton-Instanz
const apiService = new ApiService();

// Exportiere die API-Funktionen
export const login = (email: string, password: string) => apiService.login(email, password);
export const testConnection = () => apiService.testConnection();
export const enableOfflineMode = () => apiService.enableOfflineMode();
export const disableOfflineMode = () => apiService.disableOfflineMode();
export const isOfflineMode = () => apiService.isOfflineMode();

export default apiService;
