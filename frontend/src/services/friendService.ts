import { api } from './api';
import {
  Friend,
  FriendRequest,
  FriendSearchResult,
  Wishlist,
  ApiResponse,
} from '../types';

export const friendService = {
  /**
   * Obtiene la lista de amigos confirmados del usuario
   */
  async getFriends(): Promise<Friend[]> {
    const res = await api.get('/friends');
    return res.data.data || [];
  },

  /**
   * Obtiene las solicitudes de amistad pendientes entrantes y salientes
   */
  async getFriendRequests(): Promise<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }> {
    const res = await api.get('/friends/requests');
    return {
      incoming: res.data.incoming || [],
      outgoing: res.data.outgoing || [],
    };
  },

  /**
   * Busca usuarios registrados por nombre de usuario o email
   */
  async searchUsers(query: string): Promise<FriendSearchResult[]> {
    if (!query.trim()) return [];
    const res = await api.get(`/friends/search?q=${encodeURIComponent(query)}`);
    return res.data.data || [];
  },

  /**
   * Envía una solicitud de amistad
   */
  async sendFriendRequest(receiverId: string): Promise<ApiResponse> {
    const res = await api.post(`/friends/request/${receiverId}`);
    return res.data;
  },

  /**
   * Acepta o rechaza una solicitud de amistad
   */
  async respondFriendRequest(requestId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<ApiResponse> {
    const res = await api.put(`/friends/request/${requestId}`, { status });
    return res.data;
  },

  /**
   * Elimina un amigo o cancela una solicitud
   */
  async removeFriend(friendId: string): Promise<ApiResponse> {
    const res = await api.delete(`/friends/${friendId}`);
    return res.data;
  },

  /**
   * Obtiene las listas de deseos accesibles de un amigo
   */
  async getFriendWishlists(friendId: string): Promise<Wishlist[]> {
    const res = await api.get(`/friends/${friendId}/wishlists`);
    return res.data.data || [];
  },
};
