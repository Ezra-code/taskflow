import prisma from "../config/prisma.js";
import createAppError from "../utils/appError.js";

export const findOrCreateGoogleUser = async (profile) => {
  const googleId = profile.id;
  const email = profile.emails?.[0]?.value?.toLowerCase();
  const isEmailVerified = profile._json?.email_verified;

  if (!email || isEmailVerified !== true) {
    throw createAppError(
      "A verified Google email address is required",
      401
    );
  }

  // Check whether this Google account already exists
  const existingAccount = await prisma.authAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "GOOGLE",
        providerAccountId: googleId,
      },
    },
    select: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (existingAccount) {
    return existingAccount.user;
  }

  // Check whether this email belongs to an existing TaskFlow user
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw createAppError(
      "An account with this email already exists. Sign in using your existing method and link Google from your account settings.",
      409
    );
  }

  // Create a new TaskFlow user and Google authentication account
  const fullName =
    profile.displayName ||
    [profile.name?.givenName, profile.name?.familyName]
      .filter(Boolean)
      .join(" ");

  return prisma.user.create({
    data: {
      email,
      fullName,
      authAccounts: {
        create: {
          provider: "GOOGLE",
          providerAccountId: googleId,
        },
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });
};