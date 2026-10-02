import { Router } from 'express';
import {
  createWishlist,
  getMyWishlists,
  getWishlistById,
  getWishlistBySlug,
  updateWishlist,
  deleteWishlist,
  addToWhitelist,
  removeFromWhitelist,
  saveWishlist,
  unsaveWishlist,
  getSavedWishlists,
  getSharedWithMeWishlists,
} from '../controllers/wishlistController';
import { addItem, addItemsBatch } from '../controllers/itemController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validateMiddleware';
import { handleItemUpload } from '../middleware/uploadMiddleware';
import {
  createWishlistSchema,
  updateWishlistSchema,
  addWhitelistUserSchema,
} from '../schemas/wishlistSchemas';
import { batchItemsSchema } from '../schemas/itemSchemas';

const router = Router();

// Rutas públicas o semi-públicas (con autenticación opcional)
router.get('/public/:shareSlug', optionalAuthenticateToken, getWishlistBySlug);

// Rutas de guardados y compartidos (deben ir antes de /:id para evitar colisión de rutas)
router.get('/saved', authenticateToken, getSavedWishlists);
router.get('/shared-with-me', authenticateToken, getSharedWithMeWishlists);

// Rutas principales de listas (requieren autenticación)
router.post('/', authenticateToken, validateBody(createWishlistSchema), createWishlist);
router.get('/', authenticateToken, getMyWishlists);
router.get('/:id', authenticateToken, getWishlistById);
router.put('/:id', authenticateToken, validateBody(updateWishlistSchema), updateWishlist);
router.delete('/:id', authenticateToken, deleteWishlist);

// Gestión de whitelist
router.post('/:id/whitelist', authenticateToken, validateBody(addWhitelistUserSchema), addToWhitelist);
router.delete('/:id/whitelist/:userId', authenticateToken, removeFromWhitelist);

// Guardar / Anclar listas
router.post('/:id/save', authenticateToken, saveWishlist);
router.delete('/:id/save', authenticateToken, unsaveWishlist);

// Agregar items a una lista (individual o por lote)
router.post('/:id/items/batch', authenticateToken, validateBody(batchItemsSchema), addItemsBatch);
router.post('/:id/items', authenticateToken, handleItemUpload, addItem);

export default router;

