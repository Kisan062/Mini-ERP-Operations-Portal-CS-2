/**
 * tests/concurrency.test.js
 *
 * TEST 6: Concurrency test - simultaneous reservations on same stock
 *
 * Available = 100
 * Request A = 80
 * Request B = 50
 * Expected: Only ONE succeeds. Total reserved <= 100. Never goes negative.
 *
 * This test uses Promise.all to fire both reservations simultaneously,
 * and verifies that PostgreSQL's row-level locking (SELECT FOR UPDATE)
 * serializes them correctly.
 */

require('./setup');
const request = require('supertest');
const { loginAs, createTestInventory, createOrderViaApi, app, prisma } = require('./helpers');

describe('TEST 6: Concurrency - simultaneous stock reservations', () => {
  let salesToken;
  let inventory;
  let orderIdA;
  let orderIdB;

  beforeAll(async () => {
    salesToken = await loginAs('test-sales@erp.com', 'Sales@123');
    const { item, locA } = global.testData;

    // Create fresh inventory with exactly 100 units
    inventory = await createTestInventory(item.id, locA.id, 100);

    // Pre-create two orders (creation doesn't lock stock)
    const { item: itemData } = global.testData;

    const [resA, resB] = await Promise.all([
      createOrderViaApi(salesToken, inventory.id, itemData.id, 80), // Order A wants 80
      createOrderViaApi(salesToken, inventory.id, itemData.id, 50), // Order B wants 50
    ]);

    expect(resA.status).toBe(201);
    expect(resB.status).toBe(201);

    orderIdA = resA.body.data.id;
    orderIdB = resB.body.data.id;
  });

  test('Only one reservation should succeed when combined requests exceed available', async () => {
    // Fire both reservations simultaneously
    const [resultA, resultB] = await Promise.all([
      request(app)
        .post(`/api/orders/${orderIdA}/reserve`)
        .set('Authorization', `Bearer ${salesToken}`),
      request(app)
        .post(`/api/orders/${orderIdB}/reserve`)
        .set('Authorization', `Bearer ${salesToken}`),
    ]);

    const statuses = [resultA.status, resultB.status];
    const successes = statuses.filter((s) => s === 200);
    const failures = statuses.filter((s) => s === 400 || s === 409);

    // Exactly one should succeed and one should fail
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    console.log(`\n  Concurrency Test Results:`);
    console.log(`  Request A (qty=80): HTTP ${resultA.status} - ${resultA.body.message}`);
    console.log(`  Request B (qty=50): HTTP ${resultB.status} - ${resultB.body.message}\n`);
  });

  test('Total reserved quantity must never exceed 100', async () => {
    const updated = await prisma.inventory.findUnique({ where: { id: inventory.id } });
    const reserved = parseFloat(updated.reservedQty);
    const available = parseFloat(updated.physicalQty) - reserved;

    console.log(`  Final reserved: ${reserved}, Available: ${available}`);

    expect(reserved).toBeLessThanOrEqual(100);
    expect(available).toBeGreaterThanOrEqual(0);
  });

  test('Available quantity should never be negative', async () => {
    const updated = await prisma.inventory.findUnique({ where: { id: inventory.id } });
    const available = parseFloat(updated.physicalQty) - parseFloat(updated.reservedQty);
    expect(available).toBeGreaterThanOrEqual(0);
  });
});
