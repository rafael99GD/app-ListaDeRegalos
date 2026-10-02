import axios from 'axios';

// Usamos siempre la ruta relativa '/api' para que el proxy de Vite en desarrollo (0.0.0.0:5173)
// redirija las peticiones transparentemente al backend, evitando problemas de 'localhost' en móviles.
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '/api') return '/api';
  // Si en el navegador el hostname no es localhost y la URL configurada tiene localhost, forzar /api
  if (typeof window !== 'undefined' && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return '/api';
  }
  return envUrl;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar automáticamente el Bearer token almacenado
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wishlist_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para diagnóstico de conectividad en consola (LAN / Red local)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error(
        `[API NETWORK ERROR] No se pudo conectar con el backend en: ${error.config?.url} (baseURL: ${error.config?.baseURL})`
      );
    }
    return Promise.reject(error);
  }
);

// Helper para obtener la URL completa de una imagen
export const getFullImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Para rutas locales como /uploads/items/xxx.jpg, devolverlas relativas para que pasen por el proxy
  return path.startsWith('/') ? path : `/${path}`;
};
