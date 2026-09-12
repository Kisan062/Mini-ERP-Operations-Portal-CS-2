/**
 * tests/setup.js - Jest test setup
 * Handles DB connection and seeding test data for integration tests
 */

require('dotenv').config({ path: '.env.test' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Global test data holders
global.testData = {};

beforeAll(async () => {
  await prisma.$connect();

  // Create test users
  const [admin, ops, sales] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'test-admin@erp.com' },
      update: {},
      create: {
        email: 'test-admin@erp.com',
        name: 'Test Admin',
        passwordHash: await bcrypt.hash('Admin@123', 4), // low rounds for speed
        role: 'ADMIN',
      },
    }),
    prisma.user.upsert({
      where: { email: 'test-ops@erp.com' },
      update: {},
      create: {
        email: 'test-ops@erp.com',
        name: 'Test Ops',
        passwordHash: await bcrypt.hash('Ops@123', 4),
        role: 'OPERATIONS_USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'test-sales@erp.com' },
      update: {},
      create: {
        email: 'test-sales@erp.com',
        name: 'Test Sales',
        passwordHash: await bcrypt.hash('Sales@123', 4),
        role: 'SALES_USER',
      },
    }),
  ]);

  // Create test category and item
  const category = await prisma.category.upsert({
    where: { name: 'Test Category' },
    update: {},
    create: { name: 'Test Category', description: 'For testing' },
  });

  const item = await prisma.item.upsert({
    where: { code: 'TEST-001' },
    update: {},
    create: {
      code: 'TEST-001',
      name: 'Test Item',
      unit: 'PCS',
      categoryId: category.id,
    },
  });

  // Create test locations
  const [locA, locB] = await Promise.all([
    prisma.location.upsert({
      where: { code: 'TEST-LOC-A' },
      update: {},
      create: { code: 'TEST-LOC-A', name: 'Test Location A' },
    }),
    prisma.location.upsert({
      where: { code: 'TEST-LOC-B' },
      update: {},
      create: { code: 'TEST-LOC-B', name: 'Test Location B' },
    }),
  ]);

  global.testData = { admin, ops, sales, category, item, locA, locB };
});

afterAll(async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };
