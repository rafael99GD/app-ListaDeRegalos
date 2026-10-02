import { Router } from 'express';
import {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  resendRegistrationOtp,
  getMe,
} from '../controllers/authController';
import { validateBody } from '../middleware/validateMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';
import { authRateLimiter, otpVerificationLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  verifyOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/authSchemas';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/verify-otp', otpVerificationLimiter, validateBody(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', authRateLimiter, resendRegistrationOtp);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), resetPassword);
router.get('/me', authenticateToken, getMe);

export default router;
