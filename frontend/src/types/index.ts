export interface User {
  id: string;
  email: string;
  role: 'developer' | 'lead' | 'office' | 'teacher';
  createdAt: string;
  locations?: any[]; // Hinzufügen der fehlenden locations-Eigenschaft
}

export interface Location {
  id: string;
  name: string;
  createdAt: string;
}

export interface CustomButton {
  id: string;
  name: string;
  url: string;
  locationId: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  locationId: string;
  createdAt: string;
}

export interface ButtonPermission {
  buttonId: string;
  role?: string;
  userId?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  locations: Location[];
  currentLocation: Location | null;
  isLoading: boolean;
  error: string | null;
}

export interface SentEmail {
  id: string;
  recipient_email: string;
  recipient_name: string;
  status: 'sent' | 'failed' | 'resent';
  sent_at: string;
}
