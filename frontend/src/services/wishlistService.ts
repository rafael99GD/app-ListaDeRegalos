import { api } from './api';
import { Wishlist, WhitelistUser, ApiResponse } from '../types';

export const wishlistService = {
  async getMyWishlists(): Promise<Wishlist[]> {
    const res = await api.get('/wishlists');
    return res.data.wishlists;
  },

  async getSavedWishlists(): Promise<Wishlist[]> {
    const res = await api.get('/wishlists/saved');
    return res.data.wishlists;
  },

  async getSharedWithMeWishlists(): Promise<Wishlist[]> {
    const res = await api.get('/wishlists/shared-with-me');
    return res.data.wishlists;
  },

  async getWishlistById(id: string): Promise<Wishlist> {
    const res = await api.get(`/wishlists/${id}`);
    return res.data.wishlist;
  },

  async getWishlistBySlug(slug: string): Promise<Wishlist> {
    const res = await api.get(`/wishlists/public/${slug}`);
    return res.data.wishlist;
  },

  async createWishlist(data: {
    title: string;
    description?: string;
    occasion?: string;
    visibility: 'PUBLIC' | 'PRIVATE';
  }): Promise<Wishlist> {
    const res = await api.post('/wishlists', data);
    return res.data.wishlist;
  },

  async updateWishlist(
    id: string,
    data: {
      title?: string;
      description?: string;
      occasion?: string;
      visibility?: 'PUBLIC' | 'PRIVATE';
    }
  ): Promise<Wishlist> {
    const res = await api.put(`/wishlists/${id}`, data);
    return res.data.wishlist;
  },

  async deleteWishlist(id: string): Promise<ApiResponse> {
    const res = await api.delete(`/wishlists/${id}`);
    return res.data;
  },

  async addToWhitelist(wishlistId: string, username: string): Promise<WhitelistUser> {
    const res = await api.post(`/wishlists/${wishlistId}/whitelist`, { username });
    return res.data.entry;
  },

  async removeFromWhitelist(wishlistId: string, userId: string): Promise<ApiResponse> {
    const res = await api.delete(`/wishlists/${wishlistId}/whitelist/${userId}`);
    return res.data;
  },

  async saveWishlist(wishlistId: string): Promise<ApiResponse> {
    const res = await api.post(`/wishlists/${wishlistId}/save`);
    return res.data;
  },

  async unsaveWishlist(wishlistId: string): Promise<ApiResponse> {
    const res = await api.delete(`/wishlists/${wishlistId}/save`);
    return res.data;
  },
};
