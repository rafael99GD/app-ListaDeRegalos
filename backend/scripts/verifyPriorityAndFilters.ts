import process from 'node:process';
import { PrismaClient } from '@prisma/client';
import { prisma } from '../src/config/prisma';
import { createItemSchema, updateItemSchema } from '../src/schemas/itemSchemas';

async function testPriorityAndFilters() {
  console.log('🔥 ==============================================================');
  console.log('🔥 Iniciando prueba de Nivel de Deseo (Priority 1-10) y Filtros');
  console.log('🔥 ==============================================================\n');

  // Test 1: Zod Schemas Validation & Clamping
  console.log('--- Test 1: Validación y Clamping con Zod ---');
  const validPriority10 = createItemSchema.parse({
    title: 'PlayStation 5 Pro',
    priority: 10,
  });
  if (validPriority10.priority !== 10) throw new Error('Fallo: Prioridad 10 no fue respetada');
  console.log('✅ Prioridad 10 parseada correctamente');

  const clampedHigh = createItemSchema.parse({
    title: 'Super Regalo',
    priority: 99,
  });
  if (clampedHigh.priority !== 10) throw new Error('Fallo: Prioridad 99 no fue acotada a 10');
  console.log('✅ Prioridad 99 acotada a 10');

  const clampedLow = createItemSchema.parse({
    title: 'Regalo Menor',
    priority: -5,
  });
  if (clampedLow.priority !== 1) throw new Error('Fallo: Prioridad -5 no fue acotada a 1');
  console.log('✅ Prioridad -5 acotada a 1');

  const defaultVal = createItemSchema.parse({
    title: 'Regalo Estándar',
  });
  if (defaultVal.priority !== 5) throw new Error('Fallo: Prioridad por defecto no es 5');
  console.log('✅ Prioridad por defecto es 5');

  // Test 2: Database Persistence with Prisma
  console.log('\n--- Test 2: Persistencia en Base de Datos (Prisma) ---');
  const user = await prisma.user.create({
    data: {
      username: `testuser_${Date.now()}`,
      email: `testuser_${Date.now()}@example.com`,
      passwordHash: 'dummyhash',
      isVerified: true,
    },
  });

  const wishlist = await prisma.wishlist.create({
    data: {
      userId: user.id,
      title: 'Lista de Prueba Deseo',
      visibility: 'PUBLIC',
      shareSlug: `slug_${Date.now()}`,
    },
  });

  const itemMax = await prisma.item.create({
    data: {
      wishlistId: wishlist.id,
      title: 'Artículo Deseo Máximo',
      priority: 10,
    },
  });

  const itemMid = await prisma.item.create({
    data: {
      wishlistId: wishlist.id,
      title: 'Artículo Deseo Medio',
      priority: 6,
    },
  });

  const itemLow = await prisma.item.create({
    data: {
      wishlistId: wishlist.id,
      title: 'Artículo Deseo Bajo',
      priority: 2,
    },
  });

  if (itemMax.priority === 10 && itemMid.priority === 6 && itemLow.priority === 2) {
    console.log('✅ Items persistidos en SQLite con prioridades 10, 6 y 2');
  } else {
    throw new Error('Fallo en persistencia de prioridades en base de datos');
  }

  // Test 3: Updating Priority
  console.log('\n--- Test 3: Actualización de Nivel de Deseo ---');
  const updatedItem = await prisma.item.update({
    where: { id: itemLow.id },
    data: { priority: 9 },
  });
  if (updatedItem.priority === 9) {
    console.log('✅ Item actualizado correctamente de prioridad 2 a 9');
  } else {
    throw new Error('Fallo al actualizar prioridad');
  }

  // Test 4: Frontend Logic Simulation (Sorting and Filtering)
  console.log('\n--- Test 4: Simulación de Filtrado y Ordenación Frontend ---');
  const allItems = await prisma.item.findMany({
    where: { wishlistId: wishlist.id },
  });

  // Filter "high_desire" (>= 7)
  const highDesireItems = allItems.filter((i) => (i.priority || 5) >= 7);
  if (highDesireItems.length === 2 && highDesireItems.every((i) => i.priority >= 7)) {
    console.log(`✅ Filtro 'Deseo alto' (>= 7) retorna exactamente ${highDesireItems.length} items`);
  } else {
    throw new Error('Fallo en lógica de filtro high_desire');
  }

  // Sort "priority_desc" (Mayor a menor)
  const sortedItems = [...allItems].sort((a, b) => (b.priority || 5) - (a.priority || 5));
  if (sortedItems[0].priority >= sortedItems[1].priority && sortedItems[1].priority >= sortedItems[2].priority) {
    console.log(
      `✅ Ordenación por deseo (Mayor a menor): [${sortedItems.map((i) => i.priority).join(', ')}]`
    );
  } else {
    throw new Error('Fallo en ordenación por prioridad');
  }

  // Limpieza de datos de prueba
  await prisma.wishlist.delete({ where: { id: wishlist.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log('✅ Limpieza de datos de prueba completada');

  console.log('\n🎉 ==============================================================');
  console.log('🎉 TODAS LAS PRUEBAS DE NIVEL DE DESEO Y FILTROS PASARON CON ÉXITO');
  console.log('🎉 ==============================================================\n');
}

testPriorityAndFilters().catch((err) => {
  console.error('❌ Error en prueba de prioridad y filtros:', err);
  process.exit(1);
});
