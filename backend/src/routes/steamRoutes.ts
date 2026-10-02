import { Router } from 'express';
import { getSteamWishlist } from '../controllers/steamController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// GET /api/steam/wishlist?steamIdentifier=...
router.get('/wishlist', authenticateToken, getSteamWishlist);

export default router;
