import { api } from './api';
import { Item, ApiResponse } from '../types';

export const itemService = {
  async addItem(wishlistId: string, formData: FormData): Promise<Item> {
    const res = await api.post(`/wishlists/${wishlistId}/items`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.item;
  },

  async updateItem(itemId: string, formData: FormData): Promise<Item> {
    const res = await api.put(`/items/${itemId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.item;
  },

  async deleteItem(itemId: string): Promise<ApiResponse> {
    const res = await api.delete(`/items/${itemId}`);
    return res.data;
  },

  async purchaseItem(itemId: string, purchasedBy?: string): Promise<Item> {
    const res = await api.patch(`/items/${itemId}/purchase`, { purchasedBy });
    return res.data.item;
  },

  async unpurchaseItem(itemId: string): Promise<Item> {
    const res = await api.patch(`/items/${itemId}/unpurchase`);
    return res.data.item;
  },

  async addItemsBatch(
    wishlistId: string,
    items: Array<{
      title: string;
      price?: number | null;
      currency?: string;
      url?: string | null;
      imageUrl?: string | null;
      imageType?: 'URL' | 'LOCAL' | 'NONE';
    }>
  ): Promise<{ message: string; count: number; items?: Item[] }> {
    const res = await api.post(`/wishlists/${wishlistId}/items/batch`, { items });
    return res.data;
  },
};
