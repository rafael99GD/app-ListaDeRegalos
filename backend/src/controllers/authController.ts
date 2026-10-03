import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { hashPassword, comparePassword, generateOtp, hashOtp, compareOtp } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { emailService } from '../services/emailService';
import { AuthenticatedRequest } from '../types';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Verificar si ya existe usuario con ese email o username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        res.status(409).json({
          success: false,
          message: existingUser.email === email
            ? 'Ya existe una cuenta verificada con este correo electrónico'
            : 'El nombre de usuario ya se encuentra en uso',
        });
        return;
      }

      // Si existe pero aún no se ha verificado, actualizamos contraseña y generamos nuevo OTP
      const passwordHash = await hashPassword(password);
      const userFirstName =
        (firstName && typeof firstName === 'string' && firstName.trim()) ||
        existingUser.firstName ||
        username;
      const userLastName =
        (lastName && typeof lastName === 'string' && lastName.trim()) ||
        existingUser.lastName ||
        '';

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { passwordHash, username, firstName: userFirstName, lastName: userLastName },
      });

      // Invalidar OTPs anteriores
      await prisma.authOtp.updateMany({
        where: { userId: existingUser.id, type: 'REGISTRATION', used: false },
        data: { used: true },
      });

      const otp = generateOtp();
      const otpHash = await hashOtp(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

      await prisma.authOtp.create({
        data: {
          userId: existingUser.id,
          otpHash,
          type: 'REGISTRATION',
          expiresAt,
        },
      });

      const emailResult = await emailService.sendOtpEmail(email, otp, existingUser.username, 'REGISTRATION');

      if (!emailResult.success && process.env.NODE_ENV === 'production') {
        res.status(500).json({
          success: false,
          message: 'Error al enviar el correo con el código de verificación. Por favor, inténtalo de nuevo.',
          error: emailResult.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Tu cuenta ya estaba registrada pero no verificada. Te hemos enviado un nuevo código OTP.',
        email,
      });
      return;
    }

    // Nuevo usuario con nombre y apellidos
    const passwordHash = await hashPassword(password);
    const userFirstName =
      (firstName && typeof firstName === 'string' && firstName.trim()) || username;
    const userLastName =
      (lastName && typeof lastName === 'string' && lastName.trim()) || '';

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName: userFirstName,
        lastName: userLastName,
        isVerified: false,
      },
    });

    // Generar código OTP numérico de 6 dígitos
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await prisma.authOtp.create({
      data: {
        userId: user.id,
        otpHash,
        type: 'REGISTRATION',
        expiresAt,
      },
    });

    // Enviar email con código OTP
    const emailResult = await emailService.sendOtpEmail(email, otp, user.username, 'REGISTRATION');

    if (!emailResult.success && process.env.NODE_ENV === 'production') {
      res.status(500).json({
        success: false,
        message: 'No se pudo enviar el correo de verificación. Por favor revisa tus datos o inténtalo más tarde.',
        error: emailResult.error,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente. Por favor revisa tu correo para verificar tu cuenta con el código OTP.',
      email,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'No existe ninguna cuenta asociada a este correo electrónico',
      });
      return;
    }

    // Buscar el OTP activo más reciente para este usuario
    const activeOtp = await prisma.authOtp.findFirst({
      where: {
        userId: user.id,
        type: 'REGISTRATION',
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOtp) {
      res.status(400).json({
        success: false,
        message: 'No hay ningún código de verificación activo. Por favor solicita uno nuevo.',
      });
      return;
    }

    // Comprobar límite de 5 intentos
    if (activeOtp.attempts >= 5) {
      await prisma.authOtp.update({
        where: { id: activeOtp.id },
        data: { used: true },
      });
      res.status(400).json({
        success: false,
        message: 'Has superado el límite de 5 intentos permitidos. Solicita un nuevo código.',
      });
      return;
    }

    // Comprobar expiración
    if (new Date() > activeOtp.expiresAt) {
      await prisma.authOtp.update({
        where: { id: activeOtp.id },
        data: { used: true },
      });
      res.status(400).json({
        success: false,
        message: 'El código OTP ha expirado. Por favor solicita uno nuevo.',
      });
      return;
    }

    // Comparar código
    const isMatch = await compareOtp(code, activeOtp.otpHash);
    if (!isMatch) {
      // Incrementar contador de intentos
      await prisma.authOtp.update({
        where: { id: activeOtp.id },
        data: { attempts: { increment: 1 } },
      });

      const remaining = 4 - activeOtp.attempts;
      res.status(400).json({
        success: false,
        message: `Código incorrecto. Te quedan ${remaining} ${remaining === 1 ? 'intento' : 'intentos'}.`,
      });
      return;
    }

    // Marcar OTP como usado y verificar usuario
    await prisma.$transaction([
      prisma.authOtp.update({
        where: { id: activeOtp.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      }),
    ]);

    // Generar JWT de sesión
    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(200).json({
      success: true,
      message: 'Cuenta verificada con éxito',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendRegistrationOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({
        success: false,
        message: 'Esta cuenta ya está verificada. Puedes iniciar sesión.',
      });
      return;
    }

    // Invalidar anteriores
    await prisma.authOtp.updateMany({
      where: { userId: user.id, type: 'REGISTRATION', used: false },
      data: { used: true },
    });

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.authOtp.create({
      data: {
        userId: user.id,
        otpHash,
        type: 'REGISTRATION',
        expiresAt,
      },
    });

    const emailResult = await emailService.sendOtpEmail(user.email, otp, user.username, 'REGISTRATION');

    if (!emailResult.success && process.env.NODE_ENV === 'production') {
      res.status(500).json({
        success: false,
        message: 'No se pudo enviar el correo de verificación. Por favor inténtalo más tarde.',
        error: emailResult.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Nuevo código enviado exitosamente a tu correo electrónico.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    if (!user.isVerified) {
      // Re-enviamos o permitimos enviar código OTP
      res.status(403).json({
        success: false,
        isVerified: false,
        email: user.email,
        message: 'Debes verificar tu cuenta antes de iniciar sesión. Por favor ingresa el código OTP enviado a tu correo.',
      });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        isVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Para seguridad en producción no revelamos si existe, pero informamos éxito
      res.status(200).json({
        success: true,
        message: 'Si el correo existe en nuestra base de datos, recibirás un código de recuperación en breve.',
      });
      return;
    }

    // Invalidar OTPs de recuperación anteriores
    await prisma.authOtp.updateMany({
      where: { userId: user.id, type: 'PASSWORD_RESET', used: false },
      data: { used: true },
    });

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.authOtp.create({
      data: {
        userId: user.id,
        otpHash,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    const emailResult = await emailService.sendOtpEmail(user.email, otp, user.username, 'PASSWORD_RESET');

    if (!emailResult.success && process.env.NODE_ENV === 'production') {
      res.status(500).json({
        success: false,
        message: 'No se pudo enviar el correo de recuperación. Por favor inténtalo más tarde.',
        error: emailResult.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Se ha enviado un código de recuperación a tu correo electrónico.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'No existe ninguna cuenta asociada a este correo electrónico',
      });
      return;
    }

    const activeOtp = await prisma.authOtp.findFirst({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        used: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOtp) {
      res.status(400).json({
        success: false,
        message: 'No hay ningún código de recuperación activo o ya fue utilizado.',
      });
      return;
    }

    if (activeOtp.attempts >= 5) {
      await prisma.authOtp.update({
        where: { id: activeOtp.id },
        data: { used: true },
      });
      res.status(400).json({
        success: false,
        message: 'Has superado el límite de intentos permitidos. Solicita un nuevo código.',
      });
      return;
    }

    if (new Date() > activeOtp.expiresAt) {
      await prisma.authOtp.update({
        where: { id: activeOtp.id },
        data: { used: true },
      });
      res.status(400).json({
        success: false,
        message: 'El código de recuperación ha expirado.',
      });
      return;
    }

    const isMatch = await compareOtp(code, activeOtp.otpHash);
    if (!isMatch) {
      await prisma.authOtp.update({
        where: { id: activeOtp.id },
        data: { attempts: { increment: 1 } },
      });
      res.status(400).json({
        success: false,
        message: 'Código de recuperación incorrecto',
      });
      return;
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.authOtp.update({
        where: { id: activeOtp.id },
        data: { used: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, isVerified: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva clave.',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'No autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
