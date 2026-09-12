/**
 * utils/generateNumber.js - Unique reference number generators
 * Produces human-readable IDs like WO-2024-0001
 */

const generateWorkOrderNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `WO-${year}-${random}`;
};

const generateTransferNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `TR-${year}-${random}`;
};

const generateOrderNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${year}-${random}`;
};

module.exports = {
  generateWorkOrderNumber,
  generateTransferNumber,
  generateOrderNumber,
};
