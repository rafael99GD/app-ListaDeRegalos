import { Router } from 'express';
import authRoutes from './authRoutes';
import wishlistRoutes from './wishlistRoutes';
import itemRoutes from './itemRoutes';
import steamRoutes from './steamRoutes';
import friendRoutes from './friendRoutes';
import secretSantaRoutes from './secretSantaRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Endpoint de verificación de estado / health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Wishlist Hub API',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/wishlists', wishlistRoutes);
router.use('/items', itemRoutes);
router.use('/gifts', itemRoutes);
router.use('/steam', steamRoutes);
router.use('/friends', friendRoutes);
router.use('/secret-santa', secretSantaRoutes);

export default router;
