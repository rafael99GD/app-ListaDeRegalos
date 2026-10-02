import http from 'http';
import express from 'express';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import {
  initSocketServer,
  emitItemCreated,
  emitItemUpdated,
  emitItemDeleted,
} from '../src/services/socketService';

async function runSocketVerification() {
  console.log('⚡ ==============================================================');
  console.log('⚡ Iniciando batería de verificación de WebSockets (Socket.IO)');
  console.log('⚡ ==============================================================\n');

  const app = express();
  const server = http.createServer(app);
  initSocketServer(server, ['*']);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const socketUrl = `http://127.0.0.1:${address.port}`;

  console.log(`🔌 Servidor de prueba Socket.IO escuchando en ${socketUrl}\n`);

  const createClient = (): Promise<ClientSocketType> => {
    return new Promise((resolve, reject) => {
      const socket = ClientSocket(socketUrl, {
        transports: ['websocket'],
        forceNew: true,
      });
      socket.on('connect', () => resolve(socket));
      socket.on('connect_error', (err) => reject(err));
    });
  };

  let clientA: ClientSocketType | null = null;
  let clientB: ClientSocketType | null = null;
  let clientC: ClientSocketType | null = null;

  try {
    console.log('--- Paso 1: Conectar múltiples clientes (A con join_wishlist, B con join-room prefijado, C en otra sala) ---');
    clientA = await createClient();
    clientB = await createClient();
    clientC = await createClient();

    console.log('✅ Clientes A, B y C conectados exitosamente');

    const wishlistId1 = 'test-wishlist-1';
    const wishlistId2 = 'test-wishlist-2';

    // Cliente A usa 'join_wishlist' con ID limpio
    clientA.emit('join_wishlist', wishlistId1);
    // Cliente B usa 'join-room' con prefijo 'wishlist:'
    clientB.emit('join-room', `wishlist:${wishlistId1}`);
    // Cliente C se une a una sala diferente
    clientC.emit('join_wishlist', wishlistId2);

    // Pequeña espera para asegurar que los sockets se unieron a las salas
    await new Promise((r) => setTimeout(r, 200));

    // -------------------------------------------------------------
    // Test 1: item:created y gift_created en sala wishlistId1
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Validación de evento item:created y gift_created con enriquecimiento status ---');
    const mockCreatedItem = {
      id: 'item-101',
      wishlistId: wishlistId1,
      title: 'Auriculares Inalámbricos',
      price: 59.99,
      currency: 'EUR',
      isPurchased: false,
    };

    const receivedCreatedA = new Promise<any>((resolve) => clientA!.once('item:created', resolve));
    const receivedGiftCreatedB = new Promise<any>((resolve) => clientB!.once('gift_created', resolve));

    emitItemCreated(wishlistId1, mockCreatedItem);

    const [itemA, itemB] = await Promise.all([receivedCreatedA, receivedGiftCreatedB]);
    if (
      itemA.id === 'item-101' &&
      itemA.status === 'AVAILABLE' &&
      itemB.title === 'Auriculares Inalámbricos' &&
      itemB.status === 'AVAILABLE'
    ) {
      console.log('✅ item:created y gift_created recibidos con status: "AVAILABLE" por ambos clientes');
    } else {
      throw new Error('Fallo al validar datos de item:created / gift_created');
    }

    // -------------------------------------------------------------
    // Test 2: item:updated / gift_reserved / gift_purchased (reserva / compra)
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Validación de item:updated, gift_reserved y aislamiento de salas ---');
    const mockUpdatedItem = {
      id: 'item-101',
      wishlistId: wishlistId1,
      title: 'Auriculares Inalámbricos',
      price: 59.99,
      currency: 'EUR',
      isPurchased: true,
      purchasedBy: 'Anónimo',
    };

    let clientCReceivedLeak = false;
    clientC.once('item:updated', () => {
      clientCReceivedLeak = true;
    });

    const receivedUpdatedA = new Promise<any>((resolve) => clientA!.once('item:updated', resolve));
    const receivedReservedB = new Promise<any>((resolve) => clientB!.once('gift_reserved', resolve));
    const receivedPurchasedB = new Promise<any>((resolve) => clientB!.once('gift_purchased', resolve));

    emitItemUpdated(wishlistId1, mockUpdatedItem);

    const [updatedA, reservedB, purchasedB] = await Promise.all([
      receivedUpdatedA,
      receivedReservedB,
      receivedPurchasedB,
    ]);

    if (
      updatedA.isPurchased === true &&
      updatedA.status === 'RESERVED' &&
      reservedB.status === 'RESERVED' &&
      purchasedB.purchasedBy === 'Anónimo'
    ) {
      console.log('✅ item:updated, gift_reserved y gift_purchased recibidos con status: "RESERVED" y privacidad anónima');
    } else {
      throw new Error('Fallo al validar item:updated / gift_reserved / gift_purchased');
    }

    await new Promise((r) => setTimeout(r, 200));
    if (!clientCReceivedLeak) {
      console.log('✅ Aislamiento verificado: Cliente C (otra sala) no recibió el evento de la sala 1');
    } else {
      throw new Error('Fuga detectada: Cliente C recibió eventos de otra sala ajena');
    }

    // -------------------------------------------------------------
    // Test 3: item:deleted y gift_deleted
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Validación de eventos item:deleted y gift_deleted ---');
    const receivedDeletedA = new Promise<any>((resolve) => clientA!.once('item:deleted', resolve));
    const receivedGiftDeletedB = new Promise<any>((resolve) => clientB!.once('gift_deleted', resolve));

    emitItemDeleted(wishlistId1, 'item-101');

    const [deletedPayloadA, deletedPayloadB] = await Promise.all([receivedDeletedA, receivedGiftDeletedB]);
    if (
      deletedPayloadA.id === 'item-101' &&
      deletedPayloadA.wishlistId === wishlistId1 &&
      deletedPayloadB.id === 'item-101'
    ) {
      console.log('✅ item:deleted y gift_deleted recibidos con { id, wishlistId } correctos');
    } else {
      throw new Error('Fallo al validar item:deleted / gift_deleted');
    }

    // -------------------------------------------------------------
    // Test 4: leave_wishlist
    // -------------------------------------------------------------
    console.log('\n--- Test 5: Validación de leave_wishlist ---');
    clientA.emit('leave_wishlist', wishlistId1);
    await new Promise((r) => setTimeout(r, 200));

    let clientAReceivedAfterLeave = false;
    clientA.once('item:updated', () => {
      clientAReceivedAfterLeave = true;
    });

    const receivedUpdatedAfterLeaveB = new Promise<any>((resolve) => clientB!.once('item:updated', resolve));
    emitItemUpdated(wishlistId1, { id: 'item-202', title: 'Otro regalo' });

    await receivedUpdatedAfterLeaveB;
    await new Promise((r) => setTimeout(r, 200));

    if (!clientAReceivedAfterLeave) {
      console.log('✅ Cliente A abandonó la sala limpiamente y ya no recibe eventos');
    } else {
      throw new Error('Fallo: Cliente A siguió recibiendo eventos tras leave_wishlist');
    }

    console.log('\n🎉 ==============================================================');
    console.log('🎉 TODAS LAS PRUEBAS DE WEBSOCKETS (SOCKET.IO) PASARON CON ÉXITO');
    console.log('🎉 ==============================================================\n');
  } finally {
    if (clientA) clientA.disconnect();
    if (clientB) clientB.disconnect();
    if (clientC) clientC.disconnect();
    server.close();
  }
}

runSocketVerification().catch((err) => {
  console.error('❌ Error en las pruebas de WebSockets:', err);
  process.exit(1);
});
