import { api } from './api';
import { User, ApiResponse } from '../types';

export const authService = {
  async register(data: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<ApiResponse> {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async verifyOtp(data: { email: string; code: string }): Promise<{ token: string; user: User; message: string }> {
    const res = await api.post('/auth/verify-otp', data);
    return res.data;
  },

  async resendOtp(email: string): Promise<ApiResponse> {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  },

  async login(data: { identifier: string; password: string }): Promise<{ token: string; user: User; message: string }> {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async forgotPassword(email: string): Promise<ApiResponse> {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: { email: string; code: string; newPassword: string }): Promise<ApiResponse> {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await api.get('/auth/me');
    return res.data;
  },
};
