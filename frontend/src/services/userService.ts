import { api } from './api';
import { User, UpdateProfileData } from '../types';

export const userService = {
  /**
   * Obtiene los datos del perfil del usuario actual
   */
  getProfile: async (): Promise<User> => {
    const res = await api.get<{ success: boolean; user: User }>('/users/profile');
    return res.data.user;
  },

  /**
   * Actualiza el perfil de usuario (nombres, username, email y/o contraseña)
   */
  updateProfile: async (data: UpdateProfileData): Promise<{ user: User; message: string }> => {
    const res = await api.put<{ success: boolean; message: string; user: User }>(
      '/users/profile',
      data
    );
    return { user: res.data.user, message: res.data.message };
  },

  /**
   * Sube una nueva foto de perfil (Avatar), restringida a JPEG o PNG
   */
  uploadAvatar: async (file: File): Promise<{ user: User; message: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await api.post<{ success: boolean; message: string; user: User }>(
      '/users/profile/avatar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return { user: res.data.user, message: res.data.message };
  },

  /**
   * Elimina la foto de perfil actual
   */
  deleteAvatar: async (): Promise<{ user: User; message: string }> => {
    const res = await api.delete<{ success: boolean; message: string; user: User }>(
      '/users/profile/avatar'
    );
    return { user: res.data.user, message: res.data.message };
  },
};
