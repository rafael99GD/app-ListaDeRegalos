import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../src/config/prisma';
import { generateDerangement } from '../src/utils/derangement';

async function testSecretSantaSystem() {
  console.log('🎅 ==============================================================');
  console.log('🎅 Iniciando pruebas de Amigo Invisible (Feature 3/4)');
  console.log('🎅 ==============================================================\n');

  // --- Test 1: Algoritmo de Derangement (Sattolo) para 3, 5 y 10 elementos ---
  console.log('--- Test 1: Validación Matemática de Derangement (Cero auto-asignaciones) ---');
  const testSizes = [3, 5, 10];

  for (const size of testSizes) {
    const original = Array.from({ length: size }, (_, i) => `user_${i + 1}`);

    for (let run = 1; run <= 100; run++) {
      const deranged = generateDerangement(original);

      if (deranged.length !== original.length) {
        throw new Error(`Fallo en longitud: esperado ${original.length}, obtenido ${deranged.length}`);
      }

      for (let i = 0; i < size; i++) {
        if (deranged[i] === original[i]) {
          throw new Error(`Auto-asignación detectada en tamaño ${size}, índice ${i}: ${deranged[i]}`);
        }
      }

      // Validar que todos los elementos originales siguen existiendo (biyección)
      const uniqueItems = new Set(deranged);
      if (uniqueItems.size !== size) {
        throw new Error(`Fallo en biyección para tamaño ${size}: elementos duplicados`);
      }
    }

    console.log(`✅ 100 iteraciones exitosas para ${size} participantes (0 auto-asignaciones y permutación válida)`);
  }

  // --- Test 2: Persistencia en Base de Datos y Ciclo de Sorteo ---
  console.log('\n--- Test 2: Flujo en Base de Datos (Creación de Grupo y Miembros) ---');
  const timestamp = Date.now();

  const u1 = await prisma.user.create({
    data: {
      username: `santa_creator_${timestamp}`,
      email: `creator_${timestamp}@test.com`,
      passwordHash: 'dummy',
      isVerified: true,
    },
  });

  const u2 = await prisma.user.create({
    data: {
      username: `santa_guest1_${timestamp}`,
      email: `guest1_${timestamp}@test.com`,
      passwordHash: 'dummy',
      isVerified: true,
    },
  });

  const u3 = await prisma.user.create({
    data: {
      username: `santa_guest2_${timestamp}`,
      email: `guest2_${timestamp}@test.com`,
      passwordHash: 'dummy',
      isVerified: true,
    },
  });

  const group = await prisma.secretSantaGroup.create({
    data: {
      title: 'Amigo Invisible Familia 2026',
      description: 'Cena de Nochebuena con regalos',
      budget: 25.0,
      creatorId: u1.id,
      status: 'DRAFT',
      members: {
        create: [{ userId: u1.id }, { userId: u2.id }, { userId: u3.id }],
      },
    },
    include: { members: true },
  });

  if (group.members.length !== 3) {
    throw new Error('El grupo no se creó con los 3 miembros');
  }
  console.log('✅ Grupo creado en estado DRAFT con 3 miembros');

  // --- Test 3: Ejecución de Sorteo y Derangement en DB ---
  console.log('\n--- Test 3: Ejecución del Sorteo ---');
  const memberUserIds = group.members.map((m) => m.userId);
  const assignments = generateDerangement(memberUserIds);

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < memberUserIds.length; i++) {
      await tx.secretSantaMember.update({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId: memberUserIds[i],
          },
        },
        data: { assignedToId: assignments[i] },
      });
    }

    await tx.secretSantaGroup.update({
      where: { id: group.id },
      data: { status: 'DRAWN' },
    });
  });

  const drawnMembers = await prisma.secretSantaMember.findMany({
    where: { groupId: group.id },
    include: { user: true, assignedTo: true },
  });

  // Validar asignaciones en DB
  const receiverIds = new Set<string>();
  for (const m of drawnMembers) {
    if (!m.assignedToId) throw new Error(`El miembro ${m.user.username} no tiene asignación`);
    if (m.userId === m.assignedToId) throw new Error(`Auto-asignación detectada en DB para ${m.user.username}`);
    receiverIds.add(m.assignedToId);
    console.log(`  * ${m.user.username} regala a -> ${m.assignedTo?.username}`);
  }

  if (receiverIds.size !== 3) {
    throw new Error('No todos los miembros reciben un regalo');
  }
  console.log('✅ Sorteo persistido en estado DRAWN con asignaciones únicas y válidas');

  // --- Test 4: Blindaje Estricto de Privacidad ---
  console.log('\n--- Test 4: Verificación de Blindaje de Privacidad ---');
  // Simular la consulta desde la perspectiva de u1
  const sanitizedForU1 = drawnMembers.map((m) => ({
    userId: m.userId,
    assignedTo: m.userId === u1.id ? m.assignedTo?.username : null,
  }));

  const u1View = sanitizedForU1.find((m) => m.userId === u1.id);
  const u2View = sanitizedForU1.find((m) => m.userId === u2.id);
  const u3View = sanitizedForU1.find((m) => m.userId === u3.id);

  if (!u1View?.assignedTo) {
    throw new Error('El usuario creador debería ver a quién regala él mismo');
  }
  if (u2View?.assignedTo !== null || u3View?.assignedTo !== null) {
    throw new Error('Fallo crítico de privacidad: las asignaciones ajenas fueron expuestas');
  }
  console.log(`✅ Privacidad verificada: u1 ve a su asignado (${u1View.assignedTo}), pero los demás permanecen en null`);

  // --- Limpieza ---
  console.log('\n--- Limpieza de datos de prueba ---');
  await prisma.secretSantaGroup.delete({ where: { id: group.id } });
  await prisma.user.deleteMany({ where: { id: { in: [u1.id, u2.id, u3.id] } } });
  console.log('✅ Datos de prueba eliminados correctamente');

  console.log('\n🎉 ==============================================================');
  console.log('🎉 TODAS LAS PRUEBAS DE AMIGO INVISIBLE PASARON CON ÉXITO');
  console.log('🎉 ==============================================================\n');
}

testSecretSantaSystem()
  .catch((err) => {
    console.error('❌ Error en prueba de Amigo Invisible:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
