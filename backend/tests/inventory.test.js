/**
 * tests/inventory.test.js
 *
 * TEST 1: Cannot reserve more than available inventory
 * Verifies backend rejects reservations that would exceed available stock
 */

require('./setup');
const request = require('supertest');
const { loginAs, createTestInventory, createOrderViaApi, app, prisma } = require('./helpers');

describe('TEST 1: Reservation cannot exceed available inventory', () => {
  let salesToken;
  let inventory;

  beforeAll(async () => {
    salesToken = await loginAs('test-sales@erp.com', 'Sales@123');
    const { item, locA } = global.testData;

    // Create inventory with 100 units, 0 reserved
    inventory = await createTestInventory(item.id, locA.id, 100);
  });

  test('Should create order successfully', async () => {
    const { item } = global.testData;
    const res = await createOrderViaApi(salesToken, inventory.id, item.id, 60);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('Should reject reservation when requested > available', async () => {
    const { item } = global.testData;

    // Create a fresh order requesting 150 (more than 100 available)
    const orderRes = await createOrderViaApi(salesToken, inventory.id, item.id, 150);
    expect(orderRes.status).toBe(201); // order creation is OK

    // Attempt to reserve
    const reserveRes = await request(app)
      .post(`/api/orders/${orderRes.body.data.id}/reserve`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(reserveRes.status).toBe(400);
    expect(reserveRes.body.success).toBe(false);
    expect(reserveRes.body.message).toContain('Insufficient');
  });

  test('Available quantity should never go negative', async () => {
    const updated = await prisma.inventory.findUnique({ where: { id: inventory.id } });
    const available = parseFloat(updated.physicalQty) - parseFloat(updated.reservedQty);
    expect(available).toBeGreaterThanOrEqual(0);
  });
});
