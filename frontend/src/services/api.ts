import axios from 'axios';
import { ButtonPermission } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const requestPasswordReset = async (email: string) => {
  const response = await api.post('/auth/request-password-reset', { email });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

export const createUser = async (email: string, role: string, locations: string[]) => {
  const response = await api.post('/auth/create-user', { email, role, locations });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const getUsersByLocation = async (locationId: string) => {
  const response = await api.get(`/users/location/${locationId}`);
  return response.data;
};

export const getLocations = async () => {
  const response = await api.get('/locations');
  return response.data;
};

export const getUserLocations = async () => {
  const response = await api.get('/locations/my-locations');
  return response.data;
};

export const createLocation = async (name: string) => {
  const response = await api.post('/locations', { name });
  return response.data;
};

export const getButtonsForUser = async (locationId: string) => {
  const response = await api.get(`/buttons/location/${locationId}`);
  return response.data;
};

export const createCustomButton = async (name: string, url: string, locationId: string) => {
  const response = await api.post('/buttons', { name, url, locationId });
  return response.data;
};

export const setButtonPermissions = async (buttonId: string, permissions: { roles?: string[] }) => {
  const response = await api.post(`/buttons/${buttonId}/permissions`, { permissions });
  return response.data;
};

export const getEmailTemplates = async (locationId: string) => {
  const response = await api.get(`/emails/templates/location/${locationId}`);
  return response.data;
};

export const createEmailTemplate = async (name: string, subject: string, body: string, locationId: string) => {
  const response = await api.post('/emails/templates', { name, subject, body, locationId });
  return response.data;
};

export const sendBulkEmails = async (templateId: string, recipients: {email: string, name: string}[]) => {
  const response = await api.post('/emails/send-bulk', { templateId, recipients });
  return response.data;
};

export const getSentEmails = async (locationId: string) => {
  const response = await api.get(`/emails/sent?locationId=${locationId}`);
  return response.data;
};

export const resendFailedEmails = async (emailIds: string[]) => {
  const response = await api.post('/emails/resend', { emailIds });
  return response.data;
};

export const updateUser = async (userId: string, data: Partial<{email: string, role: string, locations: string[]}>) => {
  const response = await api.put(`/users/${userId}`, data);
  return response.data;
};

export const deactivateUser = async (userId: string) => {
  const response = await api.delete(`/users/${userId}`);
  return response.data;
};

export default api;
