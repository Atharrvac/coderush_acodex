/**
 * Authentication Service
 * API calls for auth operations (Legacy - using Supabase now)
 */

import api from '../config/api';
import { LoginCredentials, RegisterData, User } from '../types';

// AuthResponse type for legacy API
interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  verifyPreRegistration: async (data: { email: string; roll_no?: string; role: string }): Promise<{ valid: boolean; data: any }> => {
    const response = await api.post('/auth/verify-registration', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ user: User }> => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (newPassword: string): Promise<{ message: string }> => {
    const response = await api.put('/auth/password', { new_password: newPassword });
    return response.data;
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};
