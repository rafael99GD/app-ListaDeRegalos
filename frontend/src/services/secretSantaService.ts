import { api } from './api';
import {
  SecretSantaGroupListItem,
  SecretSantaGroupDetail,
  CreateSecretSantaPayload,
  ApiResponse,
} from '../types';

export const secretSantaService = {
  /**
   * Obtiene la lista de grupos de Amigo Invisible del usuario
   */
  async getGroups(): Promise<SecretSantaGroupListItem[]> {
    const res = await api.get('/secret-santa');
    return res.data.data || [];
  },

  /**
   * Obtiene el detalle de un grupo de Amigo Invisible con asignación propia y blindaje de privacidad
   */
  async getGroupById(id: string): Promise<SecretSantaGroupDetail> {
    const res = await api.get(`/secret-santa/${id}`);
    return res.data.data;
  },

  /**
   * Crea un nuevo grupo de Amigo Invisible
   */
  async createGroup(payload: CreateSecretSantaPayload): Promise<SecretSantaGroupDetail> {
    const res = await api.post('/secret-santa', payload);
    return res.data.data;
  },

  /**
   * Ejecuta el sorteo del Amigo Invisible (solo creador)
   */
  async drawSecretSanta(id: string): Promise<ApiResponse> {
    const res = await api.post(`/secret-santa/${id}/draw`);
    return res.data;
  },

  /**
   * Elimina un grupo de Amigo Invisible (solo creador)
   */
  async deleteGroup(id: string): Promise<ApiResponse> {
    const res = await api.delete(`/secret-santa/${id}`);
    return res.data;
  },
};
