import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../types';
import { deleteLocalFile } from '../utils/fileStorage';
import { emitItemCreated, emitItemUpdated, emitItemDeleted } from '../services/socketService';

export const addItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: wishlistId } = req.params;
    const { title, price, currency, url, imageUrl, priority } = req.body;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id: wishlistId },
    });

    if (!wishlist) {
      res.status(404).json({ success: false, message: 'Lista no encontrada' });
      return;
    }

    if (wishlist.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Solo el dueño de la lista puede agregar regalos a esta lista',
      });
      return;
    }

    let finalImageUrl: string | null = null;
    let finalImageType: 'LOCAL' | 'URL' | 'NONE' = 'NONE';

    if (req.file) {
      finalImageType = 'LOCAL';
      finalImageUrl = `/uploads/items/${req.file.filename}`;
    } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
      finalImageType = 'URL';
      finalImageUrl = imageUrl.trim();
    }

    const parsedPrice = price !== undefined && price !== null && price !== '' ? parseFloat(price) : null;
    const parsedPriority =
      priority !== undefined && priority !== null && priority !== ''
        ? Math.max(1, Math.min(10, parseInt(String(priority), 10) || 5))
        : 5;

    const item = await prisma.item.create({
      data: {
        wishlistId,
        title: title.trim(),
        price: parsedPrice !== null && !isNaN(parsedPrice) ? parsedPrice : null,
        currency: currency || 'EUR',
        url: url && typeof url === 'string' && url.trim().length > 0 ? url.trim() : null,
        imageType: finalImageType,
        imageUrl: finalImageUrl,
        priority: parsedPriority,
      },
    });

    emitItemCreated(wishlistId, item);

    res.status(201).json({
      success: true,
      message: 'Regalo agregado con éxito a la lista',
      item,
    });
  } catch (error) {
    if (req.file) {
      await deleteLocalFile(req.file.filename);
    }
    next(error);
  }
};

export const updateItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, price, currency, url, imageUrl, removeImage, priority } = req.body;

    const item = await prisma.item.findUnique({
      where: { id },
      include: { wishlist: true },
    });

    if (!item) {
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      res.status(404).json({ success: false, message: 'Regalo no encontrado' });
      return;
    }

    if (item.wishlist.userId !== userId) {
      if (req.file) {
        await deleteLocalFile(req.file.filename);
      }
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar este regalo',
      });
      return;
    }

    let finalImageUrl = item.imageUrl;
    let finalImageType = item.imageType;
    let oldImageToDelete: string | null = null;

    if (req.file) {
      // Si ya existía una imagen local previa, se programa para borrado tras actualizar la BD
      if (item.imageType === 'LOCAL' && item.imageUrl) {
        oldImageToDelete = item.imageUrl;
      }
      finalImageType = 'LOCAL';
      finalImageUrl = `/uploads/items/${req.file.filename}`;
    } else if (removeImage === 'true' || removeImage === true) {
      if (item.imageType === 'LOCAL' && item.imageUrl) {
        oldImageToDelete = item.imageUrl;
      }
      finalImageType = 'NONE';
      finalImageUrl = null;
    } else if (imageUrl !== undefined) {
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
        if (item.imageType === 'LOCAL' && item.imageUrl) {
          oldImageToDelete = item.imageUrl;
        }
        finalImageType = 'URL';
        finalImageUrl = imageUrl.trim();
      } else if (imageUrl === '' || imageUrl === null) {
        if (item.imageType === 'LOCAL' && item.imageUrl) {
          oldImageToDelete = item.imageUrl;
        }
        finalImageType = 'NONE';
        finalImageUrl = null;
      }
    }

    const parsedPrice =
      price !== undefined
        ? price === '' || price === null
          ? null
          : parseFloat(price)
        : item.price;

    const parsedPriority =
      priority !== undefined && priority !== null && priority !== ''
        ? Math.max(1, Math.min(10, parseInt(String(priority), 10) || 5))
        : undefined;

    const updated = await prisma.item.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        price: parsedPrice !== null && !isNaN(parsedPrice) ? parsedPrice : null,
        ...(currency !== undefined && { currency }),
        ...(url !== undefined && { url: url && url.trim().length > 0 ? url.trim() : null }),
        imageUrl: finalImageUrl,
        imageType: finalImageType,
        ...(parsedPriority !== undefined && { priority: parsedPriority }),
      },
    });

    // Tras actualizar la base de datos, limpiar la imagen local anterior si fue reemplazada o removida
    if (oldImageToDelete) {
      await deleteLocalFile(oldImageToDelete);
    }

    emitItemUpdated(item.wishlistId, updated);

    res.status(200).json({
      success: true,
      message: 'Regalo actualizado con éxito',
      item: updated,
    });
  } catch (error) {
    if (req.file) {
      await deleteLocalFile(req.file.filename);
    }
    next(error);
  }
};

export const deleteItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: { wishlist: true },
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'Regalo no encontrado' });
      return;
    }

    if (item.wishlist.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este regalo',
      });
      return;
    }

    // 1. Eliminar de la base de datos primero
    await prisma.item.delete({
      where: { id },
    });

    // 2. Si tenía imagen local almacenada, borrar el archivo correspondiente de disco tras la eliminación en BD
    if (item.imageType === 'LOCAL' && item.imageUrl) {
      await deleteLocalFile(item.imageUrl);
    }

    emitItemDeleted(item.wishlistId, item.id);

    res.status(200).json({
      success: true,
      message: 'Regalo eliminado correctamente',
    });
  } catch (error) {
    next(error);
  }
};

export const purchaseItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { purchasedBy } = req.body;
    const currentUserId = req.user?.id;
    const currentUsername = req.user?.username;

    // Determinar nombre del comprador
    let buyerIdentifier = 'Anónimo';
    if (purchasedBy && typeof purchasedBy === 'string' && purchasedBy.trim().length > 0) {
      buyerIdentifier = purchasedBy.trim();
    } else if (currentUsername) {
      buyerIdentifier = currentUsername;
    }

    // Transacción atómica en Prisma para garantizar bloqueo optimista y prevenir doble reserva concurrente
    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id },
        include: {
          wishlist: {
            include: {
              whitelistUsers: true,
            },
          },
        },
      });

      if (!item) {
        const notFoundError: any = new Error('Regalo no encontrado');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      // Verificar permisos si la lista es privada
      if (item.wishlist.visibility === 'PRIVATE') {
        const isOwner = currentUserId && item.wishlist.userId === currentUserId;
        const isWhitelisted =
          currentUserId && item.wishlist.whitelistUsers.some((w) => w.userId === currentUserId);

        if (!isOwner && !isWhitelisted) {
          const forbiddenError: any = new Error(
            'Esta lista es privada. Debes contar con acceso para reservar o comprar regalos.'
          );
          forbiddenError.statusCode = 403;
          throw forbiddenError;
        }
      }

      // Comprobación atómica contra colisión concurrente: HTTP 409 Conflict si ya está tomado
      if (item.isPurchased) {
        const conflictError: any = new Error('Este regalo ya ha sido reservado por otro usuario');
        conflictError.statusCode = 409;
        throw conflictError;
      }

      return await tx.item.update({
        where: { id },
        data: {
          isPurchased: true,
          purchasedBy: buyerIdentifier,
          purchasedAt: new Date(),
        },
      });
    });

    emitItemUpdated(updated.wishlistId, updated);

    res.status(200).json({
      success: true,
      message: '¡Genial! Has marcado este regalo como comprado/reservado',
      item: updated,
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};

export const unpurchaseItem = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUsername = req.user?.username;

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({
        where: { id },
        include: {
          wishlist: true,
        },
      });

      if (!item) {
        const notFoundError: any = new Error('Regalo no encontrado');
        notFoundError.statusCode = 404;
        throw notFoundError;
      }

      if (!item.isPurchased) {
        const badReqError: any = new Error('Este regalo no se encuentra marcado como comprado');
        badReqError.statusCode = 400;
        throw badReqError;
      }

      // Desmarcar: Solo permitido para el creador de la lista o el usuario que lo marcó
      const isOwner = Boolean(currentUserId && item.wishlist.userId === currentUserId);
      const isMarkedByUser = Boolean(
        (currentUserId && item.purchasedBy === currentUserId) ||
        (currentUsername && item.purchasedBy === currentUsername)
      );

      if (!isOwner && !isMarkedByUser) {
        const forbiddenError: any = new Error(
          'Solo el creador de la lista o la persona que lo reservó puede desmarcar este regalo'
        );
        forbiddenError.statusCode = 403;
        throw forbiddenError;
      }

      return await tx.item.update({
        where: { id },
        data: {
          isPurchased: false,
          purchasedBy: null,
          purchasedAt: null,
        },
      });
    });

    emitItemUpdated(updated.wishlistId, updated);

    res.status(200).json({
      success: true,
      message: 'Regalo desmarcado correctamente',
      item: updated,
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
};


export const addItemsBatch = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id: wishlistId } = req.params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id: wishlistId },
    });

    if (!wishlist) {
      res.status(404).json({ success: false, message: 'Lista no encontrada' });
      return;
    }

    if (wishlist.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Solo el dueño de la lista puede agregar regalos a esta lista',
      });
      return;
    }

    const itemsRaw = Array.isArray(req.body) ? req.body : req.body?.items;
    if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Se requiere una lista de regalos para importar',
      });
      return;
    }

    const itemsToCreate = itemsRaw.map((item: any) => {
      const parsedPrice =
        item.price !== undefined && item.price !== null && item.price !== ''
          ? parseFloat(String(item.price))
          : null;

      let finalImageType: 'URL' | 'LOCAL' | 'NONE' = 'URL';
      if (item.imageType === 'LOCAL' || item.imageType === 'NONE') {
        finalImageType = item.imageType;
      } else if (!item.imageUrl) {
        finalImageType = 'NONE';
      }

      const parsedPriority =
        item.priority !== undefined && item.priority !== null && item.priority !== ''
          ? Math.max(1, Math.min(10, parseInt(String(item.priority), 10) || 5))
          : 5;

      return {
        wishlistId,
        title: String(item.title).trim(),
        price: parsedPrice !== null && !isNaN(parsedPrice) ? parsedPrice : null,
        currency: item.currency || 'EUR',
        url: item.url && typeof item.url === 'string' && item.url.trim().length > 0 ? item.url.trim() : null,
        imageUrl:
          item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.trim().length > 0
            ? item.imageUrl.trim()
            : null,
        imageType: finalImageType,
        priority: parsedPriority,
      };
    });

    const result = await prisma.item.createMany({
      data: itemsToCreate,
    });

    // Fetch the newly created items
    const createdItems = await prisma.item.findMany({
      where: { wishlistId },
      orderBy: { createdAt: 'desc' },
      take: result.count,
    });

    emitItemCreated(wishlistId, createdItems);

    res.status(201).json({
      success: true,
      message: `${result.count} regalos importados con éxito`,
      count: result.count,
      items: createdItems,
    });
  } catch (error) {
    next(error);
  }
};

