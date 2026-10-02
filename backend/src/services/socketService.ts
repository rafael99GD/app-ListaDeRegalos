import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

const normalizeId = (rawId: string): string => {
  return String(rawId).trim().replace(/^wishlist[_:]/, '');
};

/**
 * Inicializa la instancia global de Socket.IO vinculada al servidor HTTP de Express.
 *
 * @param httpServer Servidor HTTP nativo de Node.js
 * @param allowedOrigins Lista de orígenes autorizados para CORS
 */
export const initSocketServer = (httpServer: HttpServer, allowedOrigins: string[]): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Permitir peticiones sin origen (curl/apps nativas), desarrollo, orígenes autorizados o LAN privada
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*') ||
          process.env.NODE_ENV !== 'production' ||
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)
        ) {
          callback(null, true);
        } else {
          callback(new Error('Bloqueado por política de CORS en WebSockets'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    // Unirse a las salas de sincronización en tiempo real de una lista (soporta cleanId, wishlist:ID y wishlist_ID)
    const handleJoin = (wishlistId: string) => {
      if (typeof wishlistId === 'string' && wishlistId.trim()) {
        const cleanId = normalizeId(wishlistId);
        socket.join(cleanId);
        socket.join(`wishlist:${cleanId}`);
        socket.join(`wishlist_${cleanId}`);
      }
    };

    // Abandonar las salas de sincronización de la lista
    const handleLeave = (wishlistId: string) => {
      if (typeof wishlistId === 'string' && wishlistId.trim()) {
        const cleanId = normalizeId(wishlistId);
        socket.leave(cleanId);
        socket.leave(`wishlist:${cleanId}`);
        socket.leave(`wishlist_${cleanId}`);
      }
    };

    socket.on('join_wishlist', handleJoin);
    socket.on('join-room', handleJoin);
    socket.on('join_room', handleJoin);
    socket.on('join', handleJoin);

    socket.on('leave_wishlist', handleLeave);
    socket.on('leave-room', handleLeave);
    socket.on('leave_room', handleLeave);
    socket.on('leave', handleLeave);

    socket.on('disconnect', () => {
      // Desconexión limpia
    });
  });

  return io;
};

/**
 * Retorna la instancia activa de Socket.IO (si está inicializada).
 */
export const getIO = (): SocketIOServer | null => {
  return io;
};

/**
 * Emite el evento de creación de regalo(s) a todos los clientes suscritos a la lista.
 * Emite tanto 'item:created' como 'gift_created' con estado normalizado.
 */
export const emitItemCreated = (wishlistId: string, itemOrItems: any): void => {
  if (!io) return;
  const cleanId = normalizeId(wishlistId);
  const enrich = (i: any) => ({
    ...i,
    status: i?.isPurchased ? 'RESERVED' : 'AVAILABLE',
    isPurchased: Boolean(i?.isPurchased),
  });
  const payload = Array.isArray(itemOrItems) ? itemOrItems.map(enrich) : enrich(itemOrItems);
  const rooms = [`wishlist:${cleanId}`, `wishlist_${cleanId}`, cleanId];
  rooms.forEach((room) => {
    io!.to(room).emit('item:created', payload);
    io!.to(room).emit('gift_created', payload);
  });
};

/**
 * Emite el evento de actualización de un regalo (modificación, reserva o compra) a la lista.
 * Emite 'item:updated', 'gift_updated', 'gift_reserved' / 'gift_purchased' (o unreserved) con estado garantizado.
 */
export const emitItemUpdated = (wishlistId: string, item: any): void => {
  if (!io) return;
  const cleanId = normalizeId(wishlistId);
  const enriched = {
    ...item,
    status: item?.isPurchased ? 'RESERVED' : 'AVAILABLE',
    isPurchased: Boolean(item?.isPurchased),
  };
  const rooms = [`wishlist:${cleanId}`, `wishlist_${cleanId}`, cleanId];
  rooms.forEach((room) => {
    io!.to(room).emit('item:updated', enriched);
    io!.to(room).emit('gift_updated', enriched);
    if (enriched.isPurchased) {
      io!.to(room).emit('gift_reserved', enriched);
      io!.to(room).emit('gift_purchased', enriched);
    } else {
      io!.to(room).emit('gift_unreserved', enriched);
      io!.to(room).emit('gift_available', enriched);
    }
  });
};

/**
 * Emite el evento de eliminación de un regalo a los clientes de la lista.
 * Emite tanto 'item:deleted' como 'gift_deleted'.
 */
export const emitItemDeleted = (wishlistId: string, itemId: string): void => {
  if (!io) return;
  const cleanId = normalizeId(wishlistId);
  const payload = { id: itemId, itemId, wishlistId: cleanId };
  const rooms = [`wishlist:${cleanId}`, `wishlist_${cleanId}`, cleanId];
  rooms.forEach((room) => {
    io!.to(room).emit('item:deleted', payload);
    io!.to(room).emit('gift_deleted', payload);
  });
};
