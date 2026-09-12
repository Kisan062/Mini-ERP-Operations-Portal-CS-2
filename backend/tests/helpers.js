/**
 * tests/helpers.js - Shared test helpers
 * Login helper and inventory creation shortcuts
 */

require('dotenv').config({ path: '.env.test' });
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/app');

const prisma = new PrismaClient();

/**
 * Login a user and return their JWT token
 */
const loginAs = async (email, password) => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  if (!res.body.data || !res.body.data.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token;
};

/**
 * Create a fresh inventory record with a known physical quantity
 * Returns the inventory record
 */
const createTestInventory = async (itemId, locationId, physicalQty) => {
  // Delete existing if any (to keep tests isolated)
  await prisma.inventory.deleteMany({ where: { itemId, locationId } });

  const inv = await prisma.inventory.create({
    data: { itemId, locationId, physicalQty, reservedQty: 0 },
  });
  return inv;
};

/**
 * Create a customer order via the API
 */
const createOrderViaApi = async (token, inventoryId, itemId, qty) => {
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({
      customerName: 'Test Customer',
      items: [{ itemId, inventoryId, requestedQty: qty }],
    });
  return res;
};

module.exports = { loginAs, createTestInventory, createOrderViaApi, prisma, app };
