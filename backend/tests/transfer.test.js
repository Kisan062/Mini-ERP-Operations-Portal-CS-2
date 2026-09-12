/**
 * tests/transfer.test.js
 *
 * TEST 2: Cannot transfer more than available inventory
 * TEST 3: Destination stock increases only after receipt
 * TEST 4: Same transfer cannot be received twice
 */

require('./setup');
const request = require('supertest');
const { loginAs, createTestInventory, app, prisma } = require('./helpers');

describe('Stock Transfer Tests', () => {
  let opsToken;
  let sourceInv;
  let transferId;

  beforeAll(async () => {
    opsToken = await loginAs('test-ops@erp.com', 'Ops@123');
    const { item, locA } = global.testData;

    // Source inventory: 100 units at locA
    sourceInv = await createTestInventory(item.id, locA.id, 100);
  });

  // ─── TEST 2 ───────────────────────────────────────────────────────────────
  describe('TEST 2: Cannot transfer more than available inventory', () => {
    test('Should reject transfer request when qty > available', async () => {
      const { item, locA, locB } = global.testData;

      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({
          itemId: item.id,
          sourceLocationId: locA.id,
          destLocationId: locB.id,
          quantity: 999, // way more than 100 available
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient');
    });

    test('Should allow transfer when qty <= available', async () => {
      const { item, locA, locB } = global.testData;

      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${opsToken}`)
        .send({
          itemId: item.id,
          sourceLocationId: locA.id,
          destLocationId: locB.id,
          quantity: 30, // within 100 available
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      transferId = res.body.data.id;
    });
  });

  // ─── TEST 3 ───────────────────────────────────────────────────────────────
  describe('TEST 3: Destination stock increases only after receipt', () => {
    test('Destination inventory should NOT increase after dispatch', async () => {
      const { item, locB } = global.testData;

      // Get destination inventory before dispatch (may not exist yet)
      const beforeDispatch = await prisma.inventory.findFirst({
        where: { itemId: item.id, locationId: locB.id },
      });
      const destQtyBefore = beforeDispatch ? parseFloat(beforeDispatch.physicalQty) : 0;

      // Dispatch the transfer
      const dispatchRes = await request(app)
        .post(`/api/transfers/${transferId}/dispatch`)
        .set('Authorization', `Bearer ${opsToken}`);

      expect(dispatchRes.status).toBe(200);
      expect(dispatchRes.body.data.status).toBe('DISPATCHED');

      // Check destination inventory AFTER dispatch - should NOT have changed
      const afterDispatch = await prisma.inventory.findFirst({
        where: { itemId: item.id, locationId: locB.id },
      });
      const destQtyAfterDispatch = afterDispatch ? parseFloat(afterDispatch.physicalQty) : 0;

      expect(destQtyAfterDispatch).toBe(destQtyBefore);
    });

    test('Destination inventory SHOULD increase after receipt', async () => {
      const { item, locB } = global.testData;

      const beforeReceive = await prisma.inventory.findFirst({
        where: { itemId: item.id, locationId: locB.id },
      });
      const destQtyBefore = beforeReceive ? parseFloat(beforeReceive.physicalQty) : 0;

      // Receive the transfer
      const receiveRes = await request(app)
        .post(`/api/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${opsToken}`);

      expect(receiveRes.status).toBe(200);
      expect(receiveRes.body.data.status).toBe('RECEIVED');

      // Check destination inventory AFTER receipt - should have increased by 30
      const afterReceive = await prisma.inventory.findFirst({
        where: { itemId: item.id, locationId: locB.id },
      });
      const destQtyAfterReceive = parseFloat(afterReceive.physicalQty);

      expect(destQtyAfterReceive).toBe(destQtyBefore + 30);
    });
  });

  // ─── TEST 4 ───────────────────────────────────────────────────────────────
  describe('TEST 4: Same transfer cannot be received twice', () => {
    test('Second receive on same transfer should return 409', async () => {
      // Transfer is already RECEIVED from previous test
      const res = await request(app)
        .post(`/api/transfers/${transferId}/receive`)
        .set('Authorization', `Bearer ${opsToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already been received');
    });
  });
});
