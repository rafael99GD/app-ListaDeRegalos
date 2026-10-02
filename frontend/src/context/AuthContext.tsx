import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, RegisterData } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: { identifier: string; password: string }) => Promise<{
    success: boolean;
    message?: string;
    isVerified?: boolean;
    email?: string;
  }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string; email?: string }>;
  verifyOtp: (data: { email: string; code: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateUserData: (partial: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('wishlist_auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Verificar sesión al cargar
  const verifyCurrentSession = useCallback(async () => {
    const savedToken = localStorage.getItem('wishlist_auth_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { user: currentUser } = await authService.getMe();
      setUser(currentUser);
    } catch (err) {
      console.warn('Sesión expirada o token inválido');
      localStorage.removeItem('wishlist_auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyCurrentSession();
  }, [verifyCurrentSession]);

  const login = async (data: { identifier: string; password: string }) => {
    try {
      const response = await authService.login(data);
      localStorage.setItem('wishlist_auth_token', response.token);
      setToken(response.token);
      setUser(response.user);
      return { success: true, message: response.message };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      return { success: false, message, isVerified: error.response?.data?.isVerified, email: error.response?.data?.email };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await authService.register(data);
      return { success: true, message: res.message, email: data.email };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrar usuario';
      return { success: false, message };
    }
  };

  const verifyOtp = async (data: { email: string; code: string }) => {
    try {
      const res = await authService.verifyOtp(data);
      localStorage.setItem('wishlist_auth_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return { success: true, message: res.message };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Código OTP inválido o expirado';
      return { success: false, message };
    }
  };

  const updateUserData = useCallback((partial: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const logout = () => {
    localStorage.removeItem('wishlist_auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        verifyOtp,
        logout,
        setUser,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
