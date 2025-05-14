// frontend/src/services/api.ts
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { User, Location } from '../types';

// API-Basis-URL - sollte in einer .env-Datei konfiguriert sein
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dashboard-backend-uweg.onrender.com/api';

// Lokaler Speicher-Keys
const TOKEN_KEY = 'schul_dashboard_token';
const USER_KEY = 'schul_dashboard_user';
const LOCATIONS_KEY = 'schul_dashboard_locations';
const OFFLINE_MODE_KEY = 'schul_dashboard_offline_mode';

class ApiService {
  private instance: AxiosInstance;
  private offlineMode: boolean;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // 15 Sekunden Timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Prüfen, ob der Offline-Modus aktiv ist
    this.offlineMode = localStorage.getItem(OFFLINE_MODE_KEY) === 'true';

    this.setupInterceptors();
  }

  // Interceptors für Request und Response
  private setupInterceptors(): void {
    // Request-Interceptor für das Hinzufügen des Auth-Tokens
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response-Interceptor für Fehlerbehandlung
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Prüfen, ob es sich um einen Netzwerkfehler handelt
        if (error.code === 'ECONNABORTED' || !error.response) {
          console.warn('Netzwerkfehler oder Timeout. Wechsle in den Offline-Modus.');
          this.enableOfflineMode();
        }

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  // Standardisierte Fehlerbehandlung
  private handleApiError(error: AxiosError): Error {
    let errorMessage = 'Ein unerwarteter Fehler ist aufgetreten.';
    
    if (error.response) {
      // Der Server hat mit einem Statuscode geantwortet
      const responseData = error.response.data as any;
      
      if (responseData && responseData.message) {
        errorMessage = responseData.message;
      } else if (error.response.status === 401) {
        errorMessage = 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.';
        this.logout();
      } else if (error.response.status === 403) {
        errorMessage = 'Sie haben keine Berechtigung für diese Aktion.';
      } else if (error.response.status === 404) {
        errorMessage = 'Die angeforderte Ressource wurde nicht gefunden.';
      } else if (error.response.status === 500) {
        errorMessage = 'Ein Serverfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
      }
    } else if (error.request) {
      // Die Anfrage wurde gestellt, aber keine Antwort erhalten
      errorMessage = 'Der Server antwortet nicht. Bitte überprüfen Sie Ihre Internetverbindung.';
    }
    
    return new Error(errorMessage);
  }

  // Offline-Modus aktivieren
  public enableOfflineMode(): void {
    this.offlineMode = true;
    localStorage.setItem(OFFLINE_MODE_KEY, 'true');
    console.log('Offline-Modus aktiviert');
  }

  // Offline-Modus deaktivieren
  public disableOfflineMode(): void {
    this.offlineMode = false;
    localStorage.setItem(OFFLINE_MODE_KEY, 'false');
    console.log('Offline-Modus deaktiviert');
  }

  // Prüfen, ob der Offline-Modus aktiv ist
  public isOfflineModeEnabled(): boolean {
    return this.offlineMode;
  }

  // API-Methoden

  // Authentifizierung
  public async login(email: string, password: string): Promise<any> {
    try {
      const response = await this.instance.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      // Wenn im Entwicklungsmodus oder Anfrage an admin@example.com/admin123
      if (
        (process.env.NODE_ENV === 'development' || this.offlineMode) &&
        email === 'admin@example.com' && 
        password === 'admin123'
      ) {
        console.log('Verwende Mock-Login für Entwicklung/Offline');
        
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
        
        // Mock-Daten im localStorage speichern
        localStorage.setItem(TOKEN_KEY, mockToken);
        localStorage.setItem(USER_KEY, JSON.stringify(mockUser));
        localStorage.setItem(LOCATIONS_KEY, JSON.stringify(mockLocations));
        
        return {
          token: mockToken,
          user: mockUser,
          locations: mockLocations
        };
      }
      
      throw error;
    }
  }

  public async requestPasswordReset(email: string): Promise<any> {
    const response = await this.instance.post('/auth/request-password-reset', { email });
    return response.data;
  }

  public async resetPassword(token: string, newPassword: string): Promise<any> {
    const response = await this.instance.post('/auth/reset-password', { token, newPassword });
    return response.data;
  }

  // Benutzer-Management
  public async getCurrentUser(): Promise<User> {
    if (this.offlineMode) {
      const userJson = localStorage.getItem(USER_KEY);
      if (userJson) {
        return JSON.parse(userJson);
      }
      throw new Error('Nicht authentifiziert');
    }
    
    const response = await this.instance.get('/users/me');
    return response.data;
  }

  public async getUsersByLocation(locationId: string): Promise<User[]> {
    if (this.offlineMode) {
      return [
        {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'admin@example.com',
          role: 'developer',
          createdAt: new Date().toISOString()
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          email: 'lehrer@example.com',
          role: 'teacher',
          createdAt: new Date().toISOString()
        }
      ];
    }
    
    const response = await this.instance.get(`/users/location/${locationId}`);
    return response.data;
  }

  public async createUser(email: string, role: string, locations: string[]): Promise<any> {
    const response = await this.instance.post('/auth/create-user', { email, role, locations });
    return response.data;
  }

  // Standort-Management
  public async getLocations(): Promise<Location[]> {
    if (this.offlineMode) {
      return [
        { id: 'loc-1', name: 'Hauptstandort', createdAt: new Date().toISOString() }
      ];
    }
    
    const response = await this.instance.get('/locations');
    return response.data;
  }

  public async getUserLocations(): Promise<Location[]> {
    if (this.offlineMode) {
      const locationsJson = localStorage.getItem(LOCATIONS_KEY);
      if (locationsJson) {
        return JSON.parse(locationsJson);
      }
      return [{ id: 'loc-1', name: 'Hauptstandort', createdAt: new Date().toISOString() }];
    }
    
    const response = await this.instance.get('/locations/my-locations');
    return response.data;
  }

  public async createLocation(name: string): Promise<Location> {
    const response = await this.instance.post('/locations', { name });
    return response.data;
  }

  // Button-Management
  public async getButtonsForUser(locationId: string): Promise<any[]> {
    if (this.offlineMode) {
      return [
        { 
          id: 'button-1', 
          name: 'Google', 
          url: 'https://google.com', 
          locationId, 
          createdAt: new Date().toISOString() 
        }
      ];
    }
    
    const response = await this.instance.get(`/buttons/location/${locationId}`);
    return response.data;
  }

  public async createCustomButton(name: string, url: string, locationId: string): Promise<any> {
    const response = await this.instance.post('/buttons', { name, url, locationId });
    return response.data;
  }

  public async setButtonPermissions(buttonId: string, permissions: { roles?: string[] }): Promise<any> {
    const response = await this.instance.post(`/buttons/${buttonId}/permissions`, { permissions });
    return response.data;
  }

  // E-Mail-Management
  public async getEmailTemplates(locationId: string): Promise<any[]> {
    if (this.offlineMode) {
      return [
        { 
          id: 'template-1', 
          name: 'Willkommens-E-Mail', 
          subject: 'Willkommen!', 
          body: 'Willkommen in unserem System!', 
          locationId, 
          createdAt: new Date().toISOString() 
        }
      ];
    }
    
    const response = await this.instance.get(`/emails/templates/location/${locationId}`);
    return response.data;
  }

  public async sendBulkEmails(templateId: string, recipients: {email: string, name: string}[]): Promise<any> {
    const response = await this.instance.post('/emails/send-bulk', { templateId, recipients });
    return response.data;
  }

  public async getSentEmails(locationId: string): Promise<any[]> {
    if (this.offlineMode) {
      return [];
    }
    
    const response = await this.instance.get(`/emails/sent?locationId=${locationId}`);
    return response.data;
  }

  // Benutzer-Verwaltung
  public async deactivateUser(userId: string): Promise<any> {
    const response = await this.instance.delete(`/users/${userId}`);
    return response.data;
  }

  // Authentifizierungs-Funktionen
  public isAuthenticated(): boolean {
    return localStorage.getItem(TOKEN_KEY) !== null;
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Locations können wir behalten, um den Offline-Modus zu unterstützen
  }

  // Testen der Verbindung zum Backend
  public async testConnection(): Promise<boolean> {
    try {
      await this.instance.get('/health', { timeout: 5000 });
      this.disableOfflineMode();
      return true;
    } catch (error) {
      console.error('Verbindungstest fehlgeschlagen:', error);
      this.enableOfflineMode();
      return false;
    }
  }
}

// Singleton-Instanz erstellen
const apiService = new ApiService();

// Exportiere einzelne Funktionen für einfache Verwendung
export const login = (email: string, password: string) => apiService.login(email, password);
export const requestPasswordReset = (email: string) => apiService.requestPasswordReset(email);
export const resetPassword = (token: string, newPassword: string) => apiService.resetPassword(token, newPassword);
export const getCurrentUser = () => apiService.getCurrentUser();
export const getUsersByLocation = (locationId: string) => apiService.getUsersByLocation(locationId);
export const createUser = (email: string, role: string, locations: string[]) => apiService.createUser(email, role, locations);
export const getLocations = () => apiService.getLocations();
export const getUserLocations = () => apiService.getUserLocations();
export const createLocation = (name: string) => apiService.createLocation(name);
export const getButtonsForUser = (locationId: string) => apiService.getButtonsForUser(locationId);
export const createCustomButton = (name: string, url: string, locationId: string) => apiService.createCustomButton(name, url, locationId);
export const setButtonPermissions = (buttonId: string, permissions: { roles?: string[] }) => apiService.setButtonPermissions(buttonId, permissions);
export const getEmailTemplates = (locationId: string) => apiService.getEmailTemplates(locationId);
export const sendBulkEmails = (templateId: string, recipients: {email: string, name: string}[]) => apiService.sendBulkEmails(templateId, recipients);
export const getSentEmails = (locationId: string) => apiService.getSentEmails(locationId);
export const deactivateUser = (userId: string) => apiService.deactivateUser(userId);
export const isAuthenticated = () => apiService.isAuthenticated();
export const getToken = () => apiService.getToken();
export const logout = () => apiService.logout();
export const testConnection = () => apiService.testConnection();
export const enableOfflineMode = () => apiService.enableOfflineMode();
export const disableOfflineMode = () => apiService.disableOfflineMode();
export const isOfflineModeEnabled = () => apiService.isOfflineModeEnabled();

export default apiService;
