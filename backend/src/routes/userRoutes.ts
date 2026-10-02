import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
} from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';
import { handleAvatarUpload } from '../middleware/avatarUploadMiddleware';
import { validateBody } from '../middleware/validateMiddleware';
import { updateProfileSchema } from '../schemas/authSchemas';

const router = Router();

// Rutas de perfil de usuario
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateBody(updateProfileSchema), updateProfile);
router.post('/profile/avatar', authenticateToken, handleAvatarUpload, uploadAvatar);
router.delete('/profile/avatar', authenticateToken, deleteAvatar);

export default router;
