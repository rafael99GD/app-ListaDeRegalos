import { prisma } from '../src/config/prisma';

async function runFriendVerification() {
  console.log('👥 ==============================================================');
  console.log('👥 Iniciando pruebas del Sistema Social de Amigos (Feature 2/4)');
  console.log('👥 ==============================================================');

  const timestamp = Date.now();
  const userAData = {
    username: `friend_user_a_${timestamp}`,
    email: `friend_a_${timestamp}@example.com`,
    passwordHash: 'dummy_hash',
    isVerified: true,
  };
  const userBData = {
    username: `friend_user_b_${timestamp}`,
    email: `friend_b_${timestamp}@example.com`,
    passwordHash: 'dummy_hash',
    isVerified: true,
  };
  const userCData = {
    username: `friend_user_c_${timestamp}`,
    email: `friend_c_${timestamp}@example.com`,
    passwordHash: 'dummy_hash',
    isVerified: true,
  };

  let userA: any;
  let userB: any;
  let userC: any;

  try {
    // Paso 1: Crear usuarios de prueba
    console.log('\n--- Test 1: Creación de Usuarios de Prueba ---');
    userA = await prisma.user.create({ data: userAData });
    userB = await prisma.user.create({ data: userBData });
    userC = await prisma.user.create({ data: userCData });
    console.log(`✅ Usuarios creados: ${userA.username}, ${userB.username}, ${userC.username}`);

    // Paso 2: Enviar solicitud de amistad (A -> B)
    console.log('\n--- Test 2: Envío de Solicitud de Amistad (A -> B) ---');
    const reqAB = await prisma.friendship.create({
      data: {
        senderId: userA.id,
        receiverId: userB.id,
        status: 'PENDING',
      },
    });
    if (!reqAB || reqAB.status !== 'PENDING') {
      throw new Error('La solicitud de amistad no se creó en estado PENDING');
    }
    console.log(`✅ Solicitud enviada correctamente de ${userA.username} a ${userB.username}`);

    // Paso 3: Listar solicitudes pendientes
    console.log('\n--- Test 3: Listado de Solicitudes Pendientes para B ---');
    const incomingForB = await prisma.friendship.findMany({
      where: { receiverId: userB.id, status: 'PENDING' },
      include: { sender: true },
    });
    if (incomingForB.length !== 1 || incomingForB[0].senderId !== userA.id) {
      throw new Error('El listado de solicitudes pendientes entrantes para B es incorrecto');
    }
    console.log(`✅ B tiene 1 solicitud entrante de: ${incomingForB[0].sender.username}`);

    // Paso 4: Aceptar solicitud de amistad
    console.log('\n--- Test 4: Aceptación de Solicitud de Amistad por B ---');
    const acceptedFriendship = await prisma.friendship.update({
      where: { id: reqAB.id },
      data: { status: 'ACCEPTED' },
    });
    if (acceptedFriendship.status !== 'ACCEPTED') {
      throw new Error('La solicitud no se actualizó al estado ACCEPTED');
    }
    console.log('✅ Solicitud aceptada con éxito');

    // Paso 5: Listar amigos confirmados
    console.log('\n--- Test 5: Verificación de Amigos Mutuos ---');
    const friendsOfA = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userA.id }, { receiverId: userA.id }],
      },
    });
    const friendsOfB = await prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ senderId: userB.id }, { receiverId: userB.id }],
      },
    });
    if (friendsOfA.length !== 1 || friendsOfB.length !== 1) {
      throw new Error('La relación de amistad mutua no se refleja en ambas cuentas');
    }
    console.log('✅ Amistad mutua confirmada para A y B');

    // Paso 6: Búsqueda de usuarios
    console.log('\n--- Test 6: Búsqueda de Usuarios por Query ---');
    const searchResults = await prisma.user.findMany({
      where: {
        username: { contains: `friend_user_` },
      },
      select: { id: true, username: true },
    });
    if (searchResults.length < 3) {
      throw new Error('La búsqueda de usuarios no devolvió los usuarios esperados');
    }
    console.log(`✅ Búsqueda exitosa: encontrados ${searchResults.length} usuarios con el prefijo`);

    // Paso 7: Eliminación de amistad
    console.log('\n--- Test 7: Eliminación de Amistad ---');
    await prisma.friendship.delete({
      where: { id: acceptedFriendship.id },
    });
    const remaining = await prisma.friendship.findMany({
      where: {
        OR: [{ senderId: userA.id }, { receiverId: userA.id }],
      },
    });
    if (remaining.length !== 0) {
      throw new Error('La amistad no se eliminó correctamente');
    }
    console.log('✅ Amistad eliminada correctamente');

    console.log('\n🎉 ==============================================================');
    console.log('🎉 TODAS LAS PRUEBAS DEL SISTEMA SOCIAL DE AMIGOS PASARON CON ÉXITO');
    console.log('🎉 ==============================================================');
  } finally {
    console.log('\n--- Limpieza de datos de prueba ---');
    const userIds = [userA?.id, userB?.id, userC?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.friendship.deleteMany({
        where: {
          OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }],
        },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
      console.log('✅ Datos de prueba limpiados correctamente');
    }
    await prisma.$disconnect();
  }
}

runFriendVerification().catch((err) => {
  console.error('❌ Error en las pruebas de Amigos:', err);
  process.exit(1);
});
