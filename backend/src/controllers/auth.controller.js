/**
 * controllers/auth.controller.js - HTTP request handlers for authentication
 */

const authService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    sendSuccess(res, user, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getProfile };
