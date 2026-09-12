/**
 * services/reference.service.js - CRUD for reference/master data
 * Categories, Items, Locations, Batches
 */

const { prisma } = require('../config/database');
const { NotFoundError } = require('../errors');

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

const getAllCategories = () =>
  prisma.category.findMany({ orderBy: { name: 'asc' } });

const createCategory = ({ name, description }) =>
  prisma.category.create({ data: { name, description } });

// ─── ITEMS ────────────────────────────────────────────────────────────────────

const getAllItems = () =>
  prisma.item.findMany({
    include: { category: true },
    orderBy: { name: 'asc' },
  });

const createItem = ({ code, name, description, unit, categoryId }) =>
  prisma.item.create({
    data: { code, name, description, unit: unit || 'PCS', categoryId },
    include: { category: true },
  });

// ─── LOCATIONS ────────────────────────────────────────────────────────────────

const getAllLocations = () =>
  prisma.location.findMany({ orderBy: { name: 'asc' } });

const createLocation = ({ code, name, description }) =>
  prisma.location.create({ data: { code, name, description } });

// ─── BATCHES ──────────────────────────────────────────────────────────────────

const getAllBatches = () =>
  prisma.batch.findMany({ orderBy: { batchNumber: 'asc' } });

const createBatch = ({ batchNumber, expiryDate, manufacturingDate }) =>
  prisma.batch.create({ data: { batchNumber, expiryDate, manufacturingDate } });

// ─── USERS (for assignment dropdowns) ────────────────────────────────────────

const getAllUsers = () =>
  prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });

module.exports = {
  getAllCategories,
  createCategory,
  getAllItems,
  createItem,
  getAllLocations,
  createLocation,
  getAllBatches,
  createBatch,
  getAllUsers,
};
