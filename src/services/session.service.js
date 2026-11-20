
import prisma from "../config/prisma.js";
import {
  generateRefreshToken,
  generateTokenFamilyId,
  hashRefreshToken,
} from "../utils/refreshToken.js";
import { generateAccessToken } from "../utils/token.js";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export const createSession = async (userId) => {
  const refreshToken = generateRefreshToken();
  const familyId = generateTokenFamilyId();

  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      familyId,
      expiresAt,
    },
  });

  return refreshToken;
};


export const findSessionByToken = async (refreshToken) => {
  const tokenHash = hashRefreshToken(refreshToken);

  return prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
  });
};


export const revokeSession = async (refreshToken) => {
  const session = await findSessionByToken(refreshToken);

  if (!session || session.revokedAt) {
    return false;
  }

  await prisma.refreshToken.update({
    where: {
      id: session.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return true;
};


export const rotateSession = async (refreshToken) => {
  const tokenHash = hashRefreshToken(refreshToken);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const session = await tx.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!session) {
      return null;
    }

    // Detect reuse of an already-revoked token.
    if (session.revokedAt) {
      await tx.refreshToken.updateMany({
        where: {
          familyId: session.familyId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      return null;
    }

    // Reject expired tokens.
    if (session.expiresAt <= now) {
      return null;
    }

    const newRefreshToken = generateRefreshToken();

    // Atomically claim the old token.
    const result = await tx.refreshToken.updateMany({
      where: {
        id: session.id,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        revokedAt: now,
      },
    });

    // Another request may have rotated this token already.
    if (result.count !== 1) {
      await tx.refreshToken.updateMany({
        where: {
          familyId: session.familyId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });

      return null;
    }

    const expiresAt = new Date(
      now.getTime() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await tx.refreshToken.create({
      data: {
        userId: session.userId,
        tokenHash: hashRefreshToken(newRefreshToken),
        familyId: session.familyId,
        expiresAt,
      },
    });

    return {
      accessToken: generateAccessToken(session.userId),
      refreshToken: newRefreshToken,
    };
  });
};

export const revokeAllSessions = async (userId) => {
  const result = await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return result.count;
};