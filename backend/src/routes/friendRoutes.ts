import { Router } from 'express';
import {
  getFriends,
  getFriendRequests,
  searchUsers,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  getFriendWishlists,
} from '../controllers/friendController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas del sistema social de amigos requieren autenticación
router.use(authenticateToken);

// Búsqueda y listados
router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.get('/search', searchUsers);

// Acciones sobre solicitudes
router.post('/request/:receiverId', sendFriendRequest);
router.put('/request/:requestId', respondFriendRequest);

// Gestión y visualización de amigos
router.get('/:friendId/wishlists', getFriendWishlists);
router.delete('/:friendId', removeFriend);

export default router;
