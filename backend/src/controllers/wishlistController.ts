import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { generateShareSlug } from '../utils/slug';
import { AuthenticatedRequest } from '../types';
import { deleteLocalFiles } from '../utils/fileStorage';

export const createWishlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, description, occasion, visibility } = req.body;

    // Generar slug único
    let shareSlug = generateShareSlug();
    let existingSlug = await prisma.wishlist.findUnique({ where: { shareSlug } });
    while (existingSlug) {
      shareSlug = generateShareSlug();
      existingSlug = await prisma.wishlist.findUnique({ where: { shareSlug } });
    }

    const wishlist = await prisma.wishlist.create({
      data: {
        userId,
        title,
        description: description || null,
        occasion: occasion || null,
        visibility: visibility || 'PUBLIC',
        shareSlug,
      },
      include: {
        items: true,
        _count: {
          select: { items: true, savedByUsers: true, whitelistUsers: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Lista de regalos creada con éxito',
      wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyWishlists = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const wishlists = await prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { items: true, savedByUsers: true, whitelistUsers: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      wishlists,
    });
  } catch (error) {
    next(error);
  }
};

export const getWishlistById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true },
        },
        items: {
          orderBy: { createdAt: 'desc' },
        },
        whitelistUsers: {
          include: {
            user: {
              select: { id: true, username: true, email: true },
            },
          },
        },
        savedByUsers: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Lista de regalos no encontrada',
      });
      return;
    }

    const isOwner = wishlist.userId === userId;
    const isWhitelisted = wishlist.whitelistUsers.some((w) => w.userId === userId);

    if (!isOwner && wishlist.visibility === 'PRIVATE' && !isWhitelisted) {
      res.status(403).json({
        success: false,
        message: 'Esta lista es privada. No tienes permiso para verla.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      wishlist: {
        ...wishlist,
        isOwner,
        isSaved: wishlist.savedByUsers.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getWishlistBySlug = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { shareSlug } = req.params;
    const currentUserId = req.user?.id;

    const wishlist = await prisma.wishlist.findUnique({
      where: { shareSlug },
      include: {
        user: {
          select: { id: true, username: true },
        },
        items: {
          orderBy: { createdAt: 'desc' },
        },
        whitelistUsers: {
          select: { userId: true },
        },
      },
    });

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Lista de regalos no encontrada con este enlace',
      });
      return;
    }

    const isOwner = Boolean(currentUserId && wishlist.userId === currentUserId);
    const isWhitelisted = Boolean(
      currentUserId && wishlist.whitelistUsers.some((w) => w.userId === currentUserId)
    );

    // Si es privada, solo el dueño o usuarios en whitelist pueden verla
    if (wishlist.visibility === 'PRIVATE' && !isOwner && !isWhitelisted) {
      res.status(403).json({
        success: false,
        isPrivate: true,
        message: 'Esta lista de regalos es privada. Debes iniciar sesión con una cuenta autorizada.',
      });
      return;
    }

    // Verificar si el usuario autenticado tiene la lista guardada
    let isSaved = false;
    if (currentUserId) {
      const saved = await prisma.savedWishlist.findUnique({
        where: {
          userId_wishlistId: {
            userId: currentUserId,
            wishlistId: wishlist.id,
          },
        },
      });
      isSaved = Boolean(saved);
    }

    res.status(200).json({
      success: true,
      wishlist: {
        ...wishlist,
        isOwner,
        isWhitelisted,
        isSaved,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWishlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, description, occasion, visibility } = req.body;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
    });

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Lista de regalos no encontrada',
      });
      return;
    }

    if (wishlist.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta lista de regalos',
      });
      return;
    }

    const updated = await prisma.wishlist.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(occasion !== undefined && { occasion }),
        ...(visibility !== undefined && { visibility }),
      },
      include: {
        items: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Lista actualizada exitosamente',
      wishlist: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWishlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      include: {
        items: {
          where: { imageType: 'LOCAL' },
          select: { imageUrl: true },
        },
      },
    });

    if (!wishlist) {
      res.status(404).json({
        success: false,
        message: 'Lista de regalos no encontrada',
      });
      return;
    }

    if (wishlist.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta lista de regalos',
      });
      return;
    }

    await prisma.wishlist.delete({
      where: { id },
    });

    // Limpiar archivos locales de imágenes huérfanas en disco tras la eliminación en BD
    if (wishlist.items && wishlist.items.length > 0) {
      await deleteLocalFiles(wishlist.items.map((it) => it.imageUrl));
    }

    res.status(200).json({
      success: true,
      message: 'Lista de regalos eliminada con éxito',
    });
  } catch (error) {
    next(error);
  }
};

// Whitelist management
export const addToWhitelist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = req.user!.id;
    const { id } = req.params;
    const { username } = req.body;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
    });

    if (!wishlist) {
      res.status(404).json({ success: false, message: 'Lista no encontrada' });
      return;
    }

    if (wishlist.userId !== ownerId) {
      res.status(403).json({
        success: false,
        message: 'Solo el propietario de la lista puede gestionar la lista de invitados',
      });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, email: true },
    });

    if (!targetUser) {
      res.status(404).json({
        success: false,
        message: `No se encontró ningún usuario con el nombre de usuario "${username}"`,
      });
      return;
    }

    if (targetUser.id === ownerId) {
      res.status(400).json({
        success: false,
        message: 'No necesitas agregarte a ti mismo a la lista de permitidos',
      });
      return;
    }

    const existingEntry = await prisma.wishlistWhitelist.findUnique({
      where: {
        wishlistId_userId: {
          wishlistId: id,
          userId: targetUser.id,
        },
      },
    });

    if (existingEntry) {
      res.status(409).json({
        success: false,
        message: 'El usuario ya tiene acceso a esta lista',
      });
      return;
    }

    const entry = await prisma.wishlistWhitelist.create({
      data: {
        wishlistId: id,
        userId: targetUser.id,
      },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Usuario @${targetUser.username} agregado a la lista de permitidos`,
      entry,
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWhitelist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = req.user!.id;
    const { id, userId } = req.params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
    });

    if (!wishlist) {
      res.status(404).json({ success: false, message: 'Lista no encontrada' });
      return;
    }

    if (wishlist.userId !== ownerId) {
      res.status(403).json({
        success: false,
        message: 'Solo el creador puede gestionar la lista de permitidos',
      });
      return;
    }

    await prisma.wishlistWhitelist.delete({
      where: {
        wishlistId_userId: {
          wishlistId: id,
          userId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Acceso revocado correctamente',
    });
  } catch (error) {
    next(error);
  }
};

// Saved / Anclar listas
export const saveWishlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      include: {
        whitelistUsers: true,
      },
    });

    if (!wishlist) {
      res.status(404).json({ success: false, message: 'Lista no encontrada' });
      return;
    }

    // Si es privada, validar permiso
    if (
      wishlist.visibility === 'PRIVATE' &&
      wishlist.userId !== userId &&
      !wishlist.whitelistUsers.some((w) => w.userId === userId)
    ) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para guardar una lista privada a la que no tienes acceso',
      });
      return;
    }

    await prisma.savedWishlist.upsert({
      where: {
        userId_wishlistId: {
          userId,
          wishlistId: id,
        },
      },
      create: {
        userId,
        wishlistId: id,
      },
      update: {},
    });

    res.status(200).json({
      success: true,
      message: 'Lista anclada a tus guardados',
    });
  } catch (error) {
    next(error);
  }
};

export const unsaveWishlist = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await prisma.savedWishlist.deleteMany({
      where: {
        userId,
        wishlistId: id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Lista desanclada de tus guardados',
    });
  } catch (error) {
    next(error);
  }
};

export const getSavedWishlists = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const savedEntries = await prisma.savedWishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        wishlist: {
          include: {
            user: {
              select: { id: true, username: true },
            },
            items: true,
            _count: {
              select: { items: true },
            },
          },
        },
      },
    });

    const wishlists = savedEntries.map((entry) => entry.wishlist);

    res.status(200).json({
      success: true,
      wishlists,
    });
  } catch (error) {
    next(error);
  }
};

export const getSharedWithMeWishlists = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const whitelistEntries = await prisma.wishlistWhitelist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        wishlist: {
          include: {
            user: {
              select: { id: true, username: true },
            },
            items: true,
            _count: {
              select: { items: true },
            },
          },
        },
      },
    });

    const sharedWishlists = whitelistEntries.map((entry) => entry.wishlist);

    res.status(200).json({
      success: true,
      wishlists: sharedWishlists,
    });
  } catch (error) {
    next(error);
  }
};
