/**
 * tests/auth.test.js
 *
 * TEST 5: Unauthorized user cannot perform a restricted operation
 * Verifies role-based access control is enforced at the API level
 */

require('./setup');
const request = require('supertest');
const { loginAs, app } = require('./helpers');

describe('TEST 5: Unauthorized user cannot perform restricted operations', () => {
  let salesToken;
  let opsToken;

  beforeAll(async () => {
    salesToken = await loginAs('test-sales@erp.com', 'Sales@123');
    opsToken = await loginAs('test-ops@erp.com', 'Ops@123');
  });

  test('SALES_USER cannot create a work order (ADMIN only)', async () => {
    const { item, locA, admin } = global.testData;

    const res = await request(app)
      .post('/api/work-orders')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        itemId: item.id,
        locationId: locA.id,
        assignedUserId: admin.id,
        requiredQty: 10,
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/permission|forbidden|role/i);
  });

  test('OPERATIONS_USER cannot create a customer order (SALES_USER only)', async () => {
    const { item, locA } = global.testData;

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${opsToken}`)
      .send({
        customerName: 'Test Customer',
        items: [{ itemId: item.id, inventoryId: 'some-id', requestedQty: 5 }],
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Unauthenticated request to protected route returns 401', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('SALES_USER cannot access work orders (ADMIN/OPS only)', async () => {
    const res = await request(app)
      .get('/api/work-orders')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('SALES_USER cannot dispatch a transfer (OPS only)', async () => {
    const res = await request(app)
      .post('/api/transfers/some-id/dispatch')
      .set('Authorization', `Bearer ${salesToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
