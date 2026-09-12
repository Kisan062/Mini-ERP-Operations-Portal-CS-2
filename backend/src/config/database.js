/**
 * config/database.js - Prisma Client singleton
 * Ensures a single database connection is reused across the application
 */

const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Helper to get the schema name from DATABASE_URL or default to 'public'
 */
const getSchema = () => {
  try {
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      return url.searchParams.get('schema') || 'public';
    }
  } catch {
    // Ignore URL parse error
  }
  return 'public';
};

/**
 * Returns a Prisma.raw identifier for a schema-qualified table name,
 * ensuring raw queries work seamlessly with custom schemas (e.g. 'mini_erp').
 */
const getTableName = (table) => Prisma.raw(`"${getSchema()}"."${table}"`);

// Connect and verify database connection
const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { prisma, connectDB, Prisma, getSchema, getTableName };

