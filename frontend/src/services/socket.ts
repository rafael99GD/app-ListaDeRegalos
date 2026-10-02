import { io, Socket } from 'socket.io-client';

/**
 * Determina la URL base para la conexión de WebSockets.
 * 
 * En desarrollo con Vite, nos conectamos a window.location.origin para que las peticiones
 * fluyan por el proxy de Vite (/socket.io con ws: true) sin importar si el usuario
 * accede desde localhost, 127.0.0.1 o una IP de red local (192.168.x.x).
 */
const getSocketUrl = (): string => {
  // 1. Variable específica para WebSockets si estuviese definida
  const socketEnv = import.meta.env.VITE_SOCKET_URL;
  if (socketEnv && typeof socketEnv === 'string' && socketEnv.startsWith('http')) {
    return socketEnv.replace(/\/+$/, '');
  }

  // 2. Si VITE_API_URL es una URL absoluta externa (ej: https://api.midominio.com/api)
  const apiEnv = import.meta.env.VITE_API_URL;
  if (apiEnv && typeof apiEnv === 'string' && apiEnv.startsWith('http')) {
    return apiEnv.replace(/\/api\/?$/, '');
  }

  // 3. En entorno de navegador, usar window.location.origin (pasa por proxy Vite o reverse proxy en prod)
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return 'http://localhost:5000';
};

let socket: Socket | null = null;

/**
 * Retorna la instancia singleton del cliente Socket.IO con reconexión robusta y logs limpios.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    const url = getSocketUrl();
    if (import.meta.env.DEV) {
      console.log(`[Socket.io Client] Inicializando conexión hacia: ${url}`);
    }

    socket = io(url, {
      path: '/socket.io',
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
    });

    if (import.meta.env.DEV) {
      socket.on('connect', () => {
        console.log(`[Socket.io Client] Conectado exitosamente con ID: ${socket?.id}`);
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Socket.io Client] Desconectado. Razón: ${reason}`);
      });

      socket.on('connect_error', (error) => {
        console.warn(`[Socket.io Client] Aviso de conexión: ${error.message}`);
      });

      socket.io.on('reconnect', (attempt) => {
        console.log(`[Socket.io Client] Reconectado con éxito tras ${attempt} intento(s)`);
      });
    }
  }
  return socket;
};
