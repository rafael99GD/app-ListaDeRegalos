import { Router } from 'express';
import {
  updateItem,
  deleteItem,
  purchaseItem,
  unpurchaseItem,
} from '../controllers/itemController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/authMiddleware';
import { handleItemUpload } from '../middleware/uploadMiddleware';
import { validateBody } from '../middleware/validateMiddleware';
import { purchaseItemSchema } from '../schemas/itemSchemas';

const router = Router();

// Modificar y eliminar item
router.put('/:id', authenticateToken, handleItemUpload, updateItem);
router.delete('/:id', authenticateToken, deleteItem);

// Marcar como comprado / reservado (accesible tanto a autenticados como a anónimos en listas públicas)
// Soporta tanto PATCH como POST en /purchase y en /reserve
router.patch(
  '/:id/purchase',
  optionalAuthenticateToken,
  validateBody(purchaseItemSchema),
  purchaseItem
);
router.post(
  '/:id/purchase',
  optionalAuthenticateToken,
  validateBody(purchaseItemSchema),
  purchaseItem
);
router.post(
  '/:id/reserve',
  optionalAuthenticateToken,
  validateBody(purchaseItemSchema),
  purchaseItem
);
router.patch(
  '/:id/reserve',
  optionalAuthenticateToken,
  validateBody(purchaseItemSchema),
  purchaseItem
);

// Desmarcar / Restablecer (solo creador de la lista o usuario que lo marcó)
router.patch('/:id/unpurchase', optionalAuthenticateToken, unpurchaseItem);
router.post('/:id/unpurchase', optionalAuthenticateToken, unpurchaseItem);
router.post('/:id/unreserve', optionalAuthenticateToken, unpurchaseItem);
router.patch('/:id/unreserve', optionalAuthenticateToken, unpurchaseItem);

export default router;
