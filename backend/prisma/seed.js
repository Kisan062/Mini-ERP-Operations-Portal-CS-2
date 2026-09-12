/**
 * prisma/seed.js - Database Seeder
 * Creates demo users, categories, items, locations, batches, and inventory
 *
 * Run: node prisma/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ─── Roles / Users ────────────────────────────────────────────────────────
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@erp.com' },
      update: {},
      create: {
        email: 'admin@erp.com',
        name: 'Admin User',
        passwordHash: await bcrypt.hash('Admin@123', rounds),
        role: 'ADMIN',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ops@erp.com' },
      update: {},
      create: {
        email: 'ops@erp.com',
        name: 'Operations User',
        passwordHash: await bcrypt.hash('Ops@123', rounds),
        role: 'OPERATIONS_USER',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sales@erp.com' },
      update: {},
      create: {
        email: 'sales@erp.com',
        name: 'Sales User',
        passwordHash: await bcrypt.hash('Sales@123', rounds),
        role: 'SALES_USER',
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // ─── Categories ───────────────────────────────────────────────────────────
  const rawMaterials = await prisma.category.upsert({
    where: { name: 'Raw Materials' },
    update: {},
    create: { name: 'Raw Materials', description: 'Primary raw materials for production' },
  });
  const components = await prisma.category.upsert({
    where: { name: 'Components' },
    update: {},
    create: { name: 'Components', description: 'Sub-assemblies and components' },
  });
  const finishedGoods = await prisma.category.upsert({
    where: { name: 'Finished Goods' },
    update: {},
    create: { name: 'Finished Goods', description: 'Completed products ready for sale' },
  });
  console.log('✅ Created 3 categories');

  // ─── Items ────────────────────────────────────────────────────────────────
  const steelRods = await prisma.item.upsert({
    where: { code: 'RM-001' },
    update: {},
    create: {
      code: 'RM-001',
      name: 'Steel Rods (12mm)',
      description: 'High-grade 12mm steel rods',
      unit: 'KG',
      categoryId: rawMaterials.id,
    },
  });
  const copperWire = await prisma.item.upsert({
    where: { code: 'RM-002' },
    update: {},
    create: {
      code: 'RM-002',
      name: 'Copper Wire (2mm)',
      description: 'Electrical grade copper wire',
      unit: 'MTR',
      categoryId: rawMaterials.id,
    },
  });
  const motorAssembly = await prisma.item.upsert({
    where: { code: 'COMP-001' },
    update: {},
    create: {
      code: 'COMP-001',
      name: 'Motor Assembly Unit',
      description: '5HP motor assembly',
      unit: 'PCS',
      categoryId: components.id,
    },
  });
  const bearingSet = await prisma.item.upsert({
    where: { code: 'COMP-002' },
    update: {},
    create: {
      code: 'COMP-002',
      name: 'Bearing Set (6205)',
      description: 'Deep groove ball bearing set',
      unit: 'SET',
      categoryId: components.id,
    },
  });
  console.log('✅ Created 4 items');

  // ─── Locations ────────────────────────────────────────────────────────────
  const warehouse_A = await prisma.location.upsert({
    where: { code: 'WH-A' },
    update: {},
    create: { code: 'WH-A', name: 'Warehouse A', description: 'Main storage warehouse' },
  });
  const warehouse_B = await prisma.location.upsert({
    where: { code: 'WH-B' },
    update: {},
    create: { code: 'WH-B', name: 'Warehouse B', description: 'Secondary storage' },
  });
  const production_floor = await prisma.location.upsert({
    where: { code: 'PROD-01' },
    update: {},
    create: {
      code: 'PROD-01',
      name: 'Production Floor 1',
      description: 'Assembly line area',
    },
  });
  console.log('✅ Created 3 locations');

  // ─── Batches ──────────────────────────────────────────────────────────────
  const batch2024A = await prisma.batch.upsert({
    where: { batchNumber: 'BATCH-2024-001' },
    update: {},
    create: {
      batchNumber: 'BATCH-2024-001',
      manufacturingDate: new Date('2024-01-01'),
      expiryDate: new Date('2026-12-31'),
    },
  });
  const batch2024B = await prisma.batch.upsert({
    where: { batchNumber: 'BATCH-2024-002' },
    update: {},
    create: {
      batchNumber: 'BATCH-2024-002',
      manufacturingDate: new Date('2024-06-01'),
      expiryDate: new Date('2027-05-31'),
    },
  });
  console.log('✅ Created 2 batches');

  // ─── Inventory ────────────────────────────────────────────────────────────
  const inventoryData = [
    // Steel Rods at Warehouse A - BATCH 1 (100 units)
    {
      itemId: steelRods.id,
      locationId: warehouse_A.id,
      batchId: batch2024A.id,
      physicalQty: 100,
    },
    // Steel Rods at Warehouse B - BATCH 1 (200 units)
    {
      itemId: steelRods.id,
      locationId: warehouse_B.id,
      batchId: batch2024A.id,
      physicalQty: 200,
    },
    // Copper Wire at Warehouse A (500 MTR)
    {
      itemId: copperWire.id,
      locationId: warehouse_A.id,
      batchId: batch2024B.id,
      physicalQty: 500,
    },
    // Motor Assembly at Production Floor (50 PCS)
    {
      itemId: motorAssembly.id,
      locationId: production_floor.id,
      batchId: null,
      physicalQty: 50,
    },
    // Bearing Set at Warehouse A (300 SET)
    {
      itemId: bearingSet.id,
      locationId: warehouse_A.id,
      batchId: batch2024B.id,
      physicalQty: 300,
    },
  ];

  let invCount = 0;
  for (const inv of inventoryData) {
    const exists = await prisma.inventory.findFirst({
      where: { itemId: inv.itemId, locationId: inv.locationId, batchId: inv.batchId || null },
    });
    if (!exists) {
      const created = await prisma.inventory.create({ data: inv });
      // Log initial transaction
      await prisma.inventoryTransaction.create({
        data: {
          inventoryId: created.id,
          transactionType: 'INBOUND',
          quantity: inv.physicalQty,
          notes: 'Initial seed stock',
        },
      });
      invCount++;
    }
  }
  console.log(`✅ Created ${invCount} inventory records`);

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('Demo Credentials:');
  console.log('  Admin      : admin@erp.com / Admin@123');
  console.log('  Operations : ops@erp.com / Ops@123');
  console.log('  Sales      : sales@erp.com / Sales@123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
