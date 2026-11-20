import { randomUUID } from 'node:crypto';
import prisma from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import createAppError from '../utils/appError.js';
import { generateAccessToken } from '../utils/token.js';
import { createSession } from './session.service.js';

export const registerUser = async ({ fullName, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const userId = randomUUID();

  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        id: userId,
        fullName: fullName.trim(),
        email: normalizedEmail,

        authAccounts: {
          create: {
            provider: 'LOCAL',
            providerAccountId: userId,
            passwordHash,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    if (error.code === 'P2002') {
      throw createAppError('Email is already registered', 409);
    }

    throw error;
  }
};

export const findLocalAccount = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  return prisma.authAccount.findFirst({
    where: {
      provider: 'LOCAL',
      user: {
        email: normalizedEmail,
      },
    },
    include: {
      user: true,
    },
  });
};

export const verifyCredentials = async ({ email, password }) => {
  const account = await findLocalAccount(email);

  if (!account || !account.passwordHash) {
    throw createAppError('Invalid email or password', 401);
  }

  const isPasswordValid = await comparePassword(password, account.passwordHash);

  if (!isPasswordValid) {
    throw createAppError('Invalid email or password', 401);
  }

  return {
    id: account.user.id,
    fullName: account.user.fullName,
    email: account.user.email,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await verifyCredentials({ email, password });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = await createSession(user.id);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

export const getCurrentUser = async (userId) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      username: true,
      createdAt: true,
    },
  });
};
