import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../config/prisma';
import { generateDerangement } from '../utils/derangement';
import { sendSecretSantaNotification } from '../services/emailService';

/**
 * POST /api/secret-santa
 * Crea un nuevo grupo de Amigo Invisible e invita participantes.
 */
export const createSecretSantaGroup = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, description, budget, exchangeDate, memberIds } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ success: false, message: 'El título del evento es obligatorio' });
      return;
    }

    const parsedBudget = budget !== undefined && budget !== null ? Math.max(0, Number(budget)) : 0;
    const parsedDate = exchangeDate ? new Date(exchangeDate) : null;

    // Asegurar que el creador esté incluido en los miembros y evitar duplicados
    const rawMemberIds = Array.isArray(memberIds) ? memberIds : [];
    const uniqueUserIds = Array.from(new Set([userId, ...rawMemberIds.filter((id) => typeof id === 'string')]));

    // Verificar que los usuarios existan
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: uniqueUserIds }, isVerified: true },
      select: { id: true },
    });

    const validUserIds = existingUsers.map((u) => u.id);
    if (!validUserIds.includes(userId)) {
      validUserIds.push(userId);
    }

    const group = await prisma.secretSantaGroup.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        budget: parsedBudget,
        exchangeDate: parsedDate,
        creatorId: userId,
        status: 'DRAFT',
        members: {
          create: validUserIds.map((uid) => ({
            userId: uid,
          })),
        },
      },
      include: {
        creator: { select: { id: true, username: true } },
        members: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Grupo de Amigo Invisible creado con éxito',
      data: group,
    });
  } catch (err: any) {
    console.error('Error al crear grupo de Amigo Invisible:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/secret-santa
 * Lista los eventos de Amigo Invisible donde participa el usuario autenticado.
 */
export const getSecretSantaGroups = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const groups = await prisma.secretSantaGroup.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        creator: { select: { id: true, username: true } },
        members: {
          select: {
            userId: true,
            assignedToId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = groups.map((g) => {
      const myMembership = g.members.find((m) => m.userId === userId);
      return {
        id: g.id,
        title: g.title,
        description: g.description,
        budget: g.budget,
        exchangeDate: g.exchangeDate,
        status: g.status,
        creator: g.creator,
        isCreator: g.creatorId === userId,
        membersCount: g.members.length,
        hasAssignment: !!myMembership?.assignedToId,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('Error al obtener grupos de Amigo Invisible:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/secret-santa/:id
 * Obtiene el detalle de un grupo de Amigo Invisible respetando el blindaje estricto de privacidad.
 */
export const getSecretSantaGroupById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const group = await prisma.secretSantaGroup.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, message: 'Grupo no encontrado' });
      return;
    }

    // Verificar pertenencia al grupo
    const isMember = group.members.some((m) => m.userId === userId);
    const isCreator = group.creatorId === userId;

    if (!isMember && !isCreator) {
      res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este evento de Amigo Invisible',
      });
      return;
    }

    // Identificar el registro del usuario autenticado
    const myMemberRecord = group.members.find((m) => m.userId === userId);
    const myAssignedTo = myMemberRecord?.assignedTo || null;

    // Si ya tiene persona asignada, consultar sus listas de deseos accesibles
    let myAssignedWishlists: any[] = [];
    if (myAssignedTo) {
      myAssignedWishlists = await prisma.wishlist.findMany({
        where: {
          userId: myAssignedTo.id,
          OR: [
            { visibility: 'PUBLIC' },
            { whitelistUsers: { some: { userId } } },
          ],
        },
        include: {
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // BLINDAJE DE PRIVACIDAD: Sanitizar los miembros para que bajo NINGUNA circunstancia
    // se envíen al cliente las asignaciones secretas del resto de participantes.
    const sanitizedMembers = group.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      user: m.user,
      hasAssignment: !!m.assignedToId,
      // Solo el propio usuario ve a quién le regala él
      assignedTo: m.userId === userId ? m.assignedTo : null,
    }));

    res.status(200).json({
      success: true,
      data: {
        id: group.id,
        title: group.title,
        description: group.description,
        budget: group.budget,
        exchangeDate: group.exchangeDate,
        status: group.status,
        creator: group.creator,
        isCreator,
        members: sanitizedMembers,
        myAssignedTo,
        myAssignedWishlists,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      },
    });
  } catch (err: any) {
    console.error('Error al obtener detalle de Amigo Invisible:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/secret-santa/:id/draw
 * Ejecuta el sorteo del Amigo Invisible usando el algoritmo de Derangement (Sattolo)
 * y envía notificaciones por correo electrónico a todos los participantes.
 */
export const drawSecretSanta = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const group = await prisma.secretSantaGroup.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, email: true } },
          },
        },
      },
    });

    if (!group) {
      res.status(404).json({ success: false, message: 'Grupo no encontrado' });
      return;
    }

    if (group.creatorId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Solo el creador del evento puede realizar el sorteo',
      });
      return;
    }

    if (group.status !== 'DRAFT') {
      res.status(400).json({
        success: false,
        message: 'El sorteo ya ha sido realizado previamente para este evento',
      });
      return;
    }

    if (group.members.length < 3) {
      res.status(400).json({
        success: false,
        message: 'Se requieren al menos 3 participantes para realizar el sorteo del Amigo Invisible',
      });
      return;
    }

    // Ejecutar algoritmo matemático de Derangement (cero auto-asignaciones)
    const memberUserIds = group.members.map((m) => m.userId);
    const assignedUserIds = generateDerangement(memberUserIds);

    // Persistir las asignaciones y actualizar estado a DRAWN en una transacción atómica
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < memberUserIds.length; i++) {
        await tx.secretSantaMember.update({
          where: {
            groupId_userId: {
              groupId: group.id,
              userId: memberUserIds[i],
            },
          },
          data: {
            assignedToId: assignedUserIds[i],
          },
        });
      }

      await tx.secretSantaGroup.update({
        where: { id: group.id },
        data: { status: 'DRAWN' },
      });
    });

    // Enviar notificaciones por correo de manera asíncrona no bloqueante
    const userMap = new Map(group.members.map((m) => [m.userId, m.user]));

    for (let i = 0; i < memberUserIds.length; i++) {
      const giver = userMap.get(memberUserIds[i]);
      const receiver = userMap.get(assignedUserIds[i]);

      if (giver && receiver) {
        sendSecretSantaNotification({
          to: giver.email,
          recipientUsername: giver.username,
          groupTitle: group.title,
          assignedUsername: receiver.username,
          budget: group.budget,
          exchangeDate: group.exchangeDate,
        }).catch((err) => {
          console.error(`Error enviando notificación a ${giver.email}:`, err);
        });
      }
    }

    res.status(200).json({
      success: true,
      message: '¡El sorteo se ha realizado con éxito! Todos los participantes han sido emparejados.',
    });
  } catch (err: any) {
    console.error('Error al realizar sorteo de Amigo Invisible:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/secret-santa/:id
 * Elimina un grupo de Amigo Invisible (solo el creador).
 */
export const deleteSecretSantaGroup = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const group = await prisma.secretSantaGroup.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!group) {
      res.status(404).json({ success: false, message: 'Grupo no encontrado' });
      return;
    }

    if (group.creatorId !== userId) {
      res.status(403).json({
        success: false,
        message: 'Solo el creador puede eliminar este grupo',
      });
      return;
    }

    await prisma.secretSantaGroup.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Grupo eliminado correctamente',
    });
  } catch (err: any) {
    console.error('Error al eliminar grupo de Amigo Invisible:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
