import { api } from './api';
import { SteamWishlistItem } from '../types';

export const steamService = {
  async getSteamWishlist(steamIdentifier: string): Promise<SteamWishlistItem[]> {
    const res = await api.get('/steam/wishlist', {
      params: { steamIdentifier },
    });
    // Support both { items: [...] } and direct array [...]
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return res.data.items || [];
  },
};
