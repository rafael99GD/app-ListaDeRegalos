import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { hashPassword, comparePassword } from '../utils/hash';
import { deleteLocalAvatar } from '../utils/fileStorage';

/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
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

/**
 * Actualizar datos de perfil (Nombre, Apellidos, Username, Email y Contraseña)
 */
export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { firstName, lastName, username, email, currentPassword, newPassword } = req.body;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    // 1. Validar si el nuevo username ya está en uso por otro usuario
    if (username && username.toLowerCase() !== currentUser.username.toLowerCase()) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
      });
      if (existingUsername && existingUsername.id !== userId) {
        res.status(409).json({
          success: false,
          message: 'El nombre de usuario ya se encuentra en uso por otra persona',
        });
        return;
      }
    }

    // 2. Validar si el nuevo email ya está en uso
    if (email && email.toLowerCase() !== currentUser.email.toLowerCase()) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingEmail && existingEmail.id !== userId) {
        res.status(409).json({
          success: false,
          message: 'El correo electrónico ya se encuentra registrado por otra cuenta',
        });
        return;
      }
    }

    // 3. Si se solicita cambio de contraseña, validar contraseña actual
    let updatedPasswordHash = currentUser.passwordHash;
    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({
          success: false,
          message: 'Debes ingresar tu contraseña actual para establecer una nueva',
        });
        return;
      }

      const isCurrentValid = await comparePassword(currentPassword, currentUser.passwordHash);
      if (!isCurrentValid) {
        res.status(400).json({
          success: false,
          message: 'La contraseña actual ingresada es incorrecta',
        });
        return;
      }

      updatedPasswordHash = await hashPassword(newPassword);
    }

    // 4. Actualizar usuario en base de datos
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName !== undefined ? firstName.trim() : currentUser.firstName,
        lastName: lastName !== undefined ? lastName.trim() : currentUser.lastName,
        username: username ? username.toLowerCase() : currentUser.username,
        email: email ? email.toLowerCase() : currentUser.email,
        passwordHash: updatedPasswordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado con éxito',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Subir o actualizar foto de perfil (Avatar)
 */
export const uploadAvatar = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No se ha adjuntado ningún archivo de imagen para el avatar',
      });
      return;
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      // Limpiar archivo temporal subido
      await deleteLocalAvatar(req.file.filename);
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    // Si ya tenía avatar local previo, eliminarlo de disco de manera segura
    if (currentUser.avatarUrl) {
      await deleteLocalAvatar(currentUser.avatarUrl);
    }

    const newAvatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: newAvatarUrl },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Foto de perfil actualizada correctamente',
      user: updatedUser,
    });
  } catch (error) {
    if (req.file) {
      await deleteLocalAvatar(req.file.filename);
    }
    next(error);
  }
};

/**
 * Eliminar foto de perfil
 */
export const deleteAvatar = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    if (currentUser.avatarUrl) {
      await deleteLocalAvatar(currentUser.avatarUrl);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Foto de perfil eliminada correctamente',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
