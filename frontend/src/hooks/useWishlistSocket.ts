import { useEffect, useState, useRef } from 'react';
import { getSocket } from '../services/socket';
import { Item } from '../types';
import { useToast } from '../context/ToastContext';

interface UseWishlistSocketOptions {
  wishlistId?: string | null;
  onItemCreated?: (itemOrItems: Item | Item[]) => void;
  onItemUpdated?: (item: Item) => void;
  onItemDeleted?: (deletedId: string) => void;
  currentUsername?: string;
  enableToasts?: boolean;
}

export const useWishlistSocket = ({
  wishlistId,
  onItemCreated,
  onItemUpdated,
  onItemDeleted,
  currentUsername,
  enableToasts = true,
}: UseWishlistSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdatedItemId, setLastUpdatedItemId] = useState<string | null>(null);
  const { info } = useToast();

  // Guardar callbacks en refs para que el efecto del socket no se re-ejecute por cambios de función
  const callbacksRef = useRef({
    onItemCreated,
    onItemUpdated,
    onItemDeleted,
    currentUsername,
    enableToasts,
  });

  useEffect(() => {
    callbacksRef.current = {
      onItemCreated,
      onItemUpdated,
      onItemDeleted,
      currentUsername,
      enableToasts,
    };
  }, [onItemCreated, onItemUpdated, onItemDeleted, currentUsername, enableToasts]);

  const cleanWishlistId = wishlistId ? String(wishlistId).trim().replace(/^wishlist[_:]/, '') : null;

  useEffect(() => {
    if (!cleanWishlistId) return;

    const socket = getSocket();

    const joinRooms = () => {
      if (import.meta.env.DEV) {
        console.log(`[Socket.io Wishlist] Uniendo a sala de lista: ${cleanWishlistId}`);
      }
      socket.emit('join_wishlist', cleanWishlistId);
      socket.emit('join_wishlist', `wishlist:${cleanWishlistId}`);
      socket.emit('join_wishlist', `wishlist_${cleanWishlistId}`);
      socket.emit('join-room', cleanWishlistId);
      socket.emit('join-room', `wishlist:${cleanWishlistId}`);
    };

    const leaveRooms = () => {
      if (import.meta.env.DEV) {
        console.log(`[Socket.io Wishlist] Abandonando sala de lista: ${cleanWishlistId}`);
      }
      socket.emit('leave_wishlist', cleanWishlistId);
      socket.emit('leave_wishlist', `wishlist:${cleanWishlistId}`);
      socket.emit('leave_wishlist', `wishlist_${cleanWishlistId}`);
      socket.emit('leave-room', cleanWishlistId);
      socket.emit('leave-room', `wishlist:${cleanWishlistId}`);
    };

    const handleConnect = () => {
      setIsConnected(true);
      joinRooms();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    if (socket.connected) {
      setIsConnected(true);
      joinRooms();
    } else {
      socket.connect();
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // 1. Manejo de creación (individual o en lote)
    const handleCreated = (rawPayload: any) => {
      const normalizeItem = (raw: any): Item => ({
        ...raw,
        isPurchased: typeof raw.isPurchased === 'boolean' ? raw.isPurchased : raw.status === 'RESERVED',
        status: raw.status || (raw.isPurchased ? 'RESERVED' : 'AVAILABLE'),
      });

      const payload: Item | Item[] = Array.isArray(rawPayload)
        ? rawPayload.map(normalizeItem)
        : normalizeItem(rawPayload);

      if (import.meta.env.DEV) {
        console.log('[Socket.io Wishlist] Evento recibido: item:created / gift_created', payload);
      }

      const { onItemCreated: cb, enableToasts: showToast } = callbacksRef.current;
      if (cb) {
        cb(payload);
      }

      if (showToast) {
        if (Array.isArray(payload)) {
          info(`Se han añadido ${payload.length} regalos a la lista en tiempo real`);
        } else {
          info(`Se ha añadido "${payload.title}" a la lista`);
          setLastUpdatedItemId(payload.id);
          setTimeout(() => setLastUpdatedItemId((prev) => (prev === payload.id ? null : prev)), 3000);
        }
      }
    };

    // 2. Manejo de actualización y reserva/compra
    const handleUpdated = (rawItem: any) => {
      if (!rawItem || !rawItem.id) return;

      const item: Item = {
        ...rawItem,
        isPurchased:
          typeof rawItem.isPurchased === 'boolean'
            ? rawItem.isPurchased
            : rawItem.status === 'RESERVED',
        status: rawItem.status || (rawItem.isPurchased ? 'RESERVED' : 'AVAILABLE'),
      };

      if (import.meta.env.DEV) {
        console.log(
          `[Socket.io Wishlist] Evento recibido: ${item.isPurchased ? 'gift_reserved / gift_purchased' : 'gift_updated / gift_unreserved'}`,
          item
        );
      }

      const { onItemUpdated: cb, currentUsername: username, enableToasts: showToast } = callbacksRef.current;
      if (cb) {
        cb(item);
      }

      setLastUpdatedItemId(item.id);
      setTimeout(() => setLastUpdatedItemId((prev) => (prev === item.id ? null : prev)), 3000);

      if (showToast) {
        // Evitar duplicar toast si quien ejecutó la acción fue el usuario local actual (salvo que sea anónimo)
        const isSelf = username && item.purchasedBy === username;
        if (!isSelf) {
          if (item.isPurchased) {
            info(`"${item.title}" acaba de ser reservado en tiempo real`);
          } else {
            info(`"${item.title}" vuelve a estar disponible`);
          }
        }
      }
    };

    // 3. Manejo de eliminación
    const handleDeleted = (rawPayload: any) => {
      const deletedId = typeof rawPayload === 'string' ? rawPayload : rawPayload?.id || rawPayload?.itemId;
      if (!deletedId) return;

      if (import.meta.env.DEV) {
        console.log('[Socket.io Wishlist] Evento recibido: item:deleted / gift_deleted', deletedId);
      }

      const { onItemDeleted: cb, enableToasts: showToast } = callbacksRef.current;
      if (cb) {
        cb(deletedId);
      }
      if (showToast) {
        info('Un regalo fue eliminado de la lista');
      }
    };

    // Control de deduplicación de eventos concurrentes o redundantes (150ms)
    const lastEventMap = new Map<string, number>();
    const isRecentDuplicate = (key: string, windowMs = 150): boolean => {
      const now = Date.now();
      const last = lastEventMap.get(key) || 0;
      if (now - last < windowMs) return true;
      lastEventMap.set(key, now);
      return false;
    };

    const onCreated = (payload: any) => {
      const key = Array.isArray(payload) ? payload.map((i: any) => i.id).join(',') : payload?.id;
      if (isRecentDuplicate(`created:${key}`)) return;
      handleCreated(payload);
    };

    const onUpdated = (item: any) => {
      if (isRecentDuplicate(`updated:${item?.id}:${item?.updatedAt || ''}:${Boolean(item?.isPurchased)}`)) return;
      handleUpdated(item);
    };

    const onDeleted = (payload: any) => {
      const id = typeof payload === 'string' ? payload : payload?.id || payload?.itemId;
      if (isRecentDuplicate(`deleted:${id}`)) return;
      handleDeleted(payload);
    };

    // Suscripción a todos los nombres de evento (estándar y alias)
    socket.on('item:created', onCreated);
    socket.on('gift_created', onCreated);

    socket.on('item:updated', onUpdated);
    socket.on('gift_updated', onUpdated);
    socket.on('gift_reserved', onUpdated);
    socket.on('gift_purchased', onUpdated);
    socket.on('gift_unreserved', onUpdated);
    socket.on('gift_available', onUpdated);

    socket.on('item:deleted', onDeleted);
    socket.on('gift_deleted', onDeleted);

    return () => {
      leaveRooms();
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);

      socket.off('item:created', onCreated);
      socket.off('gift_created', onCreated);

      socket.off('item:updated', onUpdated);
      socket.off('gift_updated', onUpdated);
      socket.off('gift_reserved', onUpdated);
      socket.off('gift_purchased', onUpdated);
      socket.off('gift_unreserved', onUpdated);
      socket.off('gift_available', onUpdated);

      socket.off('item:deleted', onDeleted);
      socket.off('gift_deleted', onDeleted);
    };
  }, [cleanWishlistId, info]);

  return {
    isConnected,
    lastUpdatedItemId,
  };
};
