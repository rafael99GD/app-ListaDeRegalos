import { Router } from 'express';
import {
  createSecretSantaGroup,
  getSecretSantaGroups,
  getSecretSantaGroupById,
  drawSecretSanta,
  deleteSecretSantaGroup,
} from '../controllers/secretSantaController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas de Amigo Invisible requieren autenticación
router.use(authenticateToken);

router.post('/', createSecretSantaGroup);
router.get('/', getSecretSantaGroups);
router.get('/:id', getSecretSantaGroupById);
router.post('/:id/draw', drawSecretSanta);
router.delete('/:id', deleteSecretSantaGroup);

export default router;
