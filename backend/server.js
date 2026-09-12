/**
 * server.js - Entry point for the Mini ERP backend
 * Starts the HTTP server and handles graceful shutdown
 */

require('dotenv').config();
const app = require('./src/app');
const { prisma } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Mini ERP Server running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API Docs    : http://localhost:${PORT}/api-docs`);
  console.log(`   Health      : http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received - shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database disconnected. Bye!\n');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  shutdown('UNHANDLED_REJECTION');
});
