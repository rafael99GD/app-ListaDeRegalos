import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';

/**
 * GET /api/friends
 * Obtiene la lista de amigos confirmados (ACCEPTED) del usuario autenticado.
 */
export const getFriends = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const friends = await Promise.all(
      friendships.map(async (f) => {
        const friend = f.senderId === userId ? f.receiver : f.sender;

        const accessibleWishlistsCount = await prisma.wishlist.count({
          where: {
            userId: friend.id,
            OR: [
              { visibility: 'PUBLIC' },
              { whitelistUsers: { some: { userId } } },
            ],
          },
        });

        return {
          id: friend.id,
          username: friend.username,
          email: friend.email,
          firstName: friend.firstName,
          lastName: friend.lastName,
          avatarUrl: friend.avatarUrl,
          friendshipId: f.id,
          since: f.updatedAt,
          wishlistsCount: accessibleWishlistsCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: friends.length,
      data: friends,
    });
  } catch (err: any) {
    console.error('Error al obtener lista de amigos:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/friends/requests
 * Obtiene las solicitudes de amistad pendientes entrantes y salientes.
 */
export const getFriendRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [incoming, outgoing] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          receiverId: userId,
          status: 'PENDING',
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.friendship.findMany({
        where: {
          senderId: userId,
          status: 'PENDING',
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.status(200).json({
      success: true,
      incoming: incoming.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        user: item.sender,
      })),
      outgoing: outgoing.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        user: item.receiver,
      })),
    });
  } catch (err: any) {
    console.error('Error al obtener solicitudes de amistad:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/friends/search?q=...
 * Busca usuarios registrados por username o email y devuelve su estado de relación con el usuario actual.
 */
export const searchUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const query = String(req.query.q || '').trim().toLowerCase();

    if (!query || query.length < 2) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isVerified: true,
        OR: [
          { username: { contains: query } },
          { email: { contains: query } },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        createdAt: true,
      },
      take: 20,
    });

    if (users.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const candidateIds = users.map((u) => u.id);

    const existingFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: { in: candidateIds } },
          { senderId: { in: candidateIds }, receiverId: userId },
        ],
      },
    });

    const results = users.map((user) => {
      const friendship = existingFriendships.find(
        (f) =>
          (f.senderId === userId && f.receiverId === user.id) ||
          (f.senderId === user.id && f.receiverId === userId)
      );

      let status: 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE' = 'NONE';
      let requestId: string | undefined = undefined;

      if (friendship) {
        if (friendship.status === 'ACCEPTED') {
          status = 'FRIEND';
          requestId = friendship.id;
        } else if (friendship.status === 'PENDING') {
          if (friendship.senderId === userId) {
            status = 'REQUEST_SENT';
            requestId = friendship.id;
          } else {
            status = 'REQUEST_RECEIVED';
            requestId = friendship.id;
          }
        }
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        status,
        requestId,
      };
    });

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err: any) {
    console.error('Error al buscar usuarios:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/friends/request/:receiverId
 * Envía una solicitud de amistad al usuario especificado.
 */
export const sendFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { receiverId } = req.params;

    if (receiverId === userId) {
      res.status(400).json({
        success: false,
        message: 'No puedes enviarte una solicitud de amistad a ti mismo',
      });
      return;
    }

    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, username: true },
    });

    if (!receiver) {
      res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      return;
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        res.status(400).json({ success: false, message: 'Ya sois amigos' });
        return;
      }

      if (existing.status === 'PENDING') {
        if (existing.senderId === userId) {
          res.status(400).json({
            success: false,
            message: 'Ya has enviado una solicitud pendiente a este usuario',
          });
          return;
        } else {
          const accepted = await prisma.friendship.update({
            where: { id: existing.id },
            data: { status: 'ACCEPTED' },
          });
          res.status(200).json({
            success: true,
            message: `¡Ahora eres amigo de @${receiver.username}!`,
            data: accepted,
          });
          return;
        }
      }

      const reactivated = await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          senderId: userId,
          receiverId,
          status: 'PENDING',
        },
      });

      res.status(201).json({
        success: true,
        message: `Solicitud de amistad enviada a @${receiver.username}`,
        data: reactivated,
      });
      return;
    }

    const newFriendship = await prisma.friendship.create({
      data: {
        senderId: userId,
        receiverId,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: `Solicitud de amistad enviada a @${receiver.username}`,
      data: newFriendship,
    });
  } catch (err: any) {
    console.error('Error al enviar solicitud de amistad:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/friends/request/:requestId
 * Acepta o rechaza una solicitud de amistad.
 */
export const respondFriendRequest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: "El estado debe ser 'ACCEPTED' o 'REJECTED'",
      });
      return;
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: requestId },
      include: { sender: { select: { username: true } } },
    });

    if (!friendship) {
      res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
      return;
    }

    if (friendship.receiverId !== userId) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para responder a esta solicitud',
      });
      return;
    }

    if (friendship.status === 'ACCEPTED') {
      res.status(400).json({
        success: false,
        message: 'Esta solicitud ya había sido aceptada previamente',
      });
      return;
    }

    const updated = await prisma.friendship.update({
      where: { id: requestId },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message:
        status === 'ACCEPTED'
          ? `¡Ahora eres amigo de @${friendship.sender.username}!`
          : 'Solicitud de amistad rechazada',
      data: updated,
    });
  } catch (err: any) {
    console.error('Error al responder solicitud de amistad:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/friends/:friendId
 * Elimina una amistad o cancela una solicitud existente.
 */
export const removeFriend = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { friendId } = req.params;

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
          { id: friendId, OR: [{ senderId: userId }, { receiverId: userId }] },
        ],
      },
    });

    if (!friendship) {
      res.status(404).json({
        success: false,
        message: 'Amistad o solicitud no encontrada',
      });
      return;
    }

    await prisma.friendship.delete({
      where: { id: friendship.id },
    });

    res.status(200).json({
      success: true,
      message: 'Amistad eliminada correctamente',
    });
  } catch (err: any) {
    console.error('Error al eliminar amistad:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/friends/:friendId/wishlists
 * Obtiene las listas de deseos accesibles de un amigo (públicas o autorizadas en whitelist).
 */
export const getFriendWishlists = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { friendId } = req.params;

    const areFriends = await prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
    });

    if (!areFriends) {
      res.status(403).json({
        success: false,
        message: 'Debes ser amigo de este usuario para consultar sus listas de deseos',
      });
      return;
    }

    const wishlists = await prisma.wishlist.findMany({
      where: {
        userId: friendId,
        OR: [
          { visibility: 'PUBLIC' },
          { whitelistUsers: { some: { userId } } },
        ],
      },
      include: {
        user: { select: { id: true, username: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: wishlists,
    });
  } catch (err: any) {
    console.error('Error al obtener listas del amigo:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
