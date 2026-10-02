import fs from 'fs';
import path from 'path';
import { deleteLocalFile, deleteLocalFiles, UPLOADS_ITEMS_DIR } from '../src/utils/fileStorage';
import { prisma } from '../src/config/prisma';
import { addItem, updateItem, deleteItem } from '../src/controllers/itemController';
import { deleteWishlist } from '../src/controllers/wishlistController';

async function runTests() {
  console.log('🧪 Iniciando batería de pruebas de limpieza de archivos y seguridad...\n');

  // Test 1: Helper seguro con valores nulos, vacíos y URLs externas
  console.log('--- Test 1: Valores nulos, vacíos y URLs externas ---');
  await deleteLocalFile(null);
  await deleteLocalFile(undefined);
  await deleteLocalFile('');
  await deleteLocalFile('   ');
  await deleteLocalFile('https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/10/header.jpg');
  await deleteLocalFile('http://example.com/some-image.png');
  console.log('✅ Pasó: No se lanzaron excepciones y las URLs externas fueron ignoradas.\n');

  // Test 2: Protección de archivos especiales (.gitkeep)
  console.log('--- Test 2: Protección de .gitkeep ---');
  const gitkeepPath = path.join(UPLOADS_ITEMS_DIR, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# Keep directory in git\n');
  }
  await deleteLocalFile('.gitkeep');
  await deleteLocalFile('/uploads/items/.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    throw new Error('❌ Falló: .gitkeep fue eliminado incorrectamente!');
  }
  console.log('✅ Pasó: .gitkeep permanece intacto en disco.\n');

  // Test 3: Prevención de Path Traversal
  console.log('--- Test 3: Prevención de Path Traversal ---');
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json debe existir');
  }
  await deleteLocalFile('../../package.json');
  await deleteLocalFile('/uploads/items/../../package.json');
  await deleteLocalFile('/uploads/items/../../../package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('❌ Falló: package.json fue eliminado por Path Traversal!');
  }
  console.log('✅ Pasó: Intentos de Path Traversal bloqueados correctamente.\n');

  // Test 4: Archivo inexistente
  console.log('--- Test 4: Archivo inexistente ---');
  await deleteLocalFile('/uploads/items/non-existent-uuid-12345678.jpg');
  console.log('✅ Pasó: Archivo inexistente ignorado sin error.\n');

  // Test 5: Borrado físico real de archivo local existente
  console.log('--- Test 5: Borrado físico de archivo local existente ---');
  const tempFileName = `test-temp-${Date.now()}.png`;
  const tempFilePath = path.join(UPLOADS_ITEMS_DIR, tempFileName);
  fs.writeFileSync(tempFilePath, 'dummy image content');
  if (!fs.existsSync(tempFilePath)) {
    throw new Error('No se pudo crear archivo de prueba temporal');
  }
  await deleteLocalFile(`/uploads/items/${tempFileName}`);
  if (fs.existsSync(tempFilePath)) {
    throw new Error('❌ Falló: El archivo temporal no fue eliminado');
  }
  console.log('✅ Pasó: Archivo temporal eliminado correctamente de disco.\n');

  // Test 6: Borrado en lote con deleteLocalFiles
  console.log('--- Test 6: Borrado en lote con deleteLocalFiles ---');
  const batch1 = `batch-1-${Date.now()}.jpg`;
  const batch2 = `batch-2-${Date.now()}.jpg`;
  const p1 = path.join(UPLOADS_ITEMS_DIR, batch1);
  const p2 = path.join(UPLOADS_ITEMS_DIR, batch2);
  fs.writeFileSync(p1, 'batch 1');
  fs.writeFileSync(p2, 'batch 2');
  await deleteLocalFiles([`/uploads/items/${batch1}`, batch2]);
  if (fs.existsSync(p1) || fs.existsSync(p2)) {
    throw new Error('❌ Falló: Uno o más archivos del lote no fueron eliminados');
  }
  console.log('✅ Pasó: Archivos de lote eliminados correctamente.\n');

  // Test 7: Integración con controladores (crear regalo con imagen, reemplazarla, y borrar regalo)
  console.log('--- Test 7: Ciclo completo en controladores de Item ---');
  // Crear usuario de prueba y lista de prueba
  const testEmail = `test-cleanup-${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      username: `testuser_${Date.now()}`,
      email: testEmail,
      passwordHash: 'dummyhash',
      isVerified: true,
    },
  });

  const wishlist = await prisma.wishlist.create({
    data: {
      userId: user.id,
      title: 'Lista de Pruebas de Limpieza',
      shareSlug: `test-cleanup-${Date.now()}`,
    },
  });

  // 7.1 Crear regalo con imagen
  const imgFile1 = `img-item-1-${Date.now()}.png`;
  const imgPath1 = path.join(UPLOADS_ITEMS_DIR, imgFile1);
  fs.writeFileSync(imgPath1, 'imagen 1');

  // Simular req/res para addItem
  let createdItem: any = null;
  const mockReqAdd: any = {
    user: { id: user.id },
    params: { id: wishlist.id },
    body: { title: 'Regalo con Imagen' },
    file: { filename: imgFile1 },
  };
  const mockResAdd: any = {
    status: (code: number) => ({
      json: (data: any) => {
        createdItem = data.item;
      },
    }),
  };
  await addItem(mockReqAdd, mockResAdd, (err) => { if (err) throw err; });

  if (!createdItem || createdItem.imageType !== 'LOCAL') {
    throw new Error('No se creó el item correctamente');
  }
  if (!fs.existsSync(imgPath1)) {
    throw new Error('El archivo de imagen 1 no existe en disco tras crearlo');
  }
  console.log('  * Regalo creado con imagen local en disco:', imgFile1);

  // 7.2 Actualizar regalo reemplazando la imagen con una nueva
  const imgFile2 = `img-item-2-${Date.now()}.png`;
  const imgPath2 = path.join(UPLOADS_ITEMS_DIR, imgFile2);
  fs.writeFileSync(imgPath2, 'imagen 2');

  const mockReqUpdate: any = {
    user: { id: user.id },
    params: { id: createdItem.id },
    body: { title: 'Regalo con Imagen Actualizada' },
    file: { filename: imgFile2 },
  };
  let updatedItem: any = null;
  const mockResUpdate: any = {
    status: (code: number) => ({
      json: (data: any) => {
        updatedItem = data.item;
      },
    }),
  };
  await updateItem(mockReqUpdate, mockResUpdate, (err) => { if (err) throw err; });

  // Verificar que imgPath1 FUE ELIMINADO de disco y imgPath2 EXISTE
  if (fs.existsSync(imgPath1)) {
    throw new Error('❌ Falló: La imagen anterior no fue eliminada tras actualizar con una nueva!');
  }
  if (!fs.existsSync(imgPath2)) {
    throw new Error('❌ Falló: La nueva imagen no existe en disco');
  }
  console.log('  * Regalo actualizado: imagen previa eliminada de disco y nueva conservada.');

  // 7.3 Eliminar el regalo
  const mockReqDelete: any = {
    user: { id: user.id },
    params: { id: createdItem.id },
  };
  const mockResDelete: any = {
    status: (code: number) => ({
      json: (data: any) => {},
    }),
  };
  await deleteItem(mockReqDelete, mockResDelete, (err) => { if (err) throw err; });

  // Verificar que imgPath2 FUE ELIMINADO de disco
  if (fs.existsSync(imgPath2)) {
    throw new Error('❌ Falló: La imagen no fue eliminada tras borrar el regalo!');
  }
  console.log('  * Regalo eliminado: imagen eliminada definitivamente de disco.');

  // 7.4 Test de eliminación de lista con regalos con imágenes
  const imgFile3 = `img-item-3-${Date.now()}.png`;
  const imgPath3 = path.join(UPLOADS_ITEMS_DIR, imgFile3);
  fs.writeFileSync(imgPath3, 'imagen 3');
  await prisma.item.create({
    data: {
      wishlistId: wishlist.id,
      title: 'Item de lista a borrar',
      imageType: 'LOCAL',
      imageUrl: `/uploads/items/${imgFile3}`,
    },
  });

  const mockReqDeleteWishlist: any = {
    user: { id: user.id },
    params: { id: wishlist.id },
  };
  const mockResDeleteWishlist: any = {
    status: (code: number) => ({
      json: (data: any) => {},
    }),
  };
  await deleteWishlist(mockReqDeleteWishlist, mockResDeleteWishlist, (err) => { if (err) throw err; });

  if (fs.existsSync(imgPath3)) {
    throw new Error('❌ Falló: La imagen del regalo en lista no fue eliminada tras borrar la lista!');
  }
  console.log('  * Lista eliminada: imágenes de regalos en cascada eliminadas de disco.');

  // Limpieza final de usuario de prueba
  await prisma.user.delete({ where: { id: user.id } }).catch(() => {});

  // Confirmar que .gitkeep sigue vivo
  if (!fs.existsSync(gitkeepPath)) {
    throw new Error('❌ Falló: .gitkeep fue borrado durante las pruebas!');
  }
  console.log('  * .gitkeep sigue preservado intacto.');

  console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!');
}

runTests()
  .catch((err) => {
    console.error('❌ Error en pruebas:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
