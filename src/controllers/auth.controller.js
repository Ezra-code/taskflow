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

  const { refreshToken, ...responseData } = result;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });

  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: responseData,
  });
};

export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw createAppError("Refresh token required", 401);
  }

  const result = await rotateSession(refreshToken);

  const { refreshToken: newRefreshToken, ...responseData } = result;

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });

  return res.status(200).json({
    status: "success",
    message: "Session refreshed",
    data: responseData,
  });
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await revokeSession(refreshToken);
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
  });

  return res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};


export const logoutAll = async (req, res) => {
  const revokedSessions = await revokeAllSessions(req.user.id);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
  });

  return res.status(200).json({
    status: "success",
    message: "Logged out from all devices successfully",
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
