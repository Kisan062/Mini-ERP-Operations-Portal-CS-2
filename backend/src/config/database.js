/**
 * config/database.js - Prisma Client singleton
 * Ensures a single database connection is reused across the application
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

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

module.exports = { prisma, connectDB };
