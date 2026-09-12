/**
 * utils/response.js - Standardized API response helpers
 * Ensures consistent JSON structure across all endpoints
 */

/**
 * Send a success response
 * @param {import('express').Response} res
 * @param {any} data - The data payload
 * @param {string} [message] - Optional message
 * @param {number} [statusCode=200] - HTTP status code
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a created (201) response
 */
const sendCreated = (res, data, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a paginated list response
 */
const sendList = (res, data, total, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: { total, count: data.length },
  });
};

module.exports = { sendSuccess, sendCreated, sendList };
