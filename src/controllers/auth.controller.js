import {
  registerUser,
  loginUser,
  getCurrentUser,
} from '../services/auth.service.js';
import {
  rotateSession,
  revokeSession,
  revokeAllSessions,
} from '../services/session.service.js';
import createAppError from '../utils/appError.js';

export const register = async (req, res) => {
  const user = await registerUser(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Account created successfully',
    data: {
      user,
    },
  });
};

export const login = async (req, res) => {
  const result = await loginUser(req.body);

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: result,
  });
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  const tokens = await rotateSession(refreshToken);

  if (!tokens) {
    throw createAppError('Invalid or expired refresh token', 401);
  }

  res.status(200).json({
    status: 'success',
    message: 'Token refreshed successfully',
    data: tokens,
  });
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  await revokeSession(refreshToken);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

export const logoutAll = async (req, res) => {
  const revokedSessions = await revokeAllSessions(req.user.id);

  res.status(200).json({
    status: 'success',
    message: 'Logged out from all devices successfully',
    data: {
      revokedSessions,
    },
  });
};

export const getMe = async (req, res) => {
  const user = await getCurrentUser(req.user.id);

  if (!user) {
    throw createAppError('User not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
};
