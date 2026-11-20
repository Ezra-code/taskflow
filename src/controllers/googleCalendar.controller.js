
import { google } from "googleapis";

import { createGoogleOAuthClient } from "../config/googleOAuth.js";
import {
  generateOAuthState,
  validateOAuthState,
} from "../utils/googleOAuthState.js";
import createAppError from "../utils/appError.js";
import prisma from "../config/prisma.js";

const NONCE_COOKIE = "google_oauth_nonce";

const CALLBACK_PATH =
  "/api/v1/auth/google/calendar/callback";

const CALENDAR_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
];

// Initiate Calendar connection
export const initiateCalendarConnection = (req, res) => {
  const { state, nonce } = generateOAuthState(req.user.id);

  res.cookie(NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
    path: CALLBACK_PATH,
  });

  const oauthClient = createGoogleOAuthClient();

  const authorizationUrl = oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: CALENDAR_SCOPES,
    state,
    prompt: "consent select_account",
  });

  return res.status(200).json({
    status: "success",
    data: {
      authorizationUrl,
    },
  });
};

// Handle Google's Calendar OAuth callback
export const handleCalendarCallback = async (req, res) => {
  const { code, state, error } = req.query;

  // Handle denied authorization
  if (error) {
    res.clearCookie(NONCE_COOKIE, {
      path: CALLBACK_PATH,
    });

    throw createAppError(
      "Google Calendar authorization was denied",
      400
    );
  }

  // Validate OAuth state and browser nonce
  let decodedState;

  try {
    decodedState = validateOAuthState(
      state,
      req.cookies?.[NONCE_COOKIE]
    );
  } catch {
    res.clearCookie(NONCE_COOKIE, {
      path: CALLBACK_PATH,
    });

    throw createAppError(
      "Invalid or expired OAuth state",
      401
    );
  }

  // Consume nonce cookie
  res.clearCookie(NONCE_COOKIE, {
    path: CALLBACK_PATH,
  });

  if (typeof code !== "string") {
    throw createAppError(
      "Google authorization code is missing",
      400
    );
  }

  // Create an independent OAuth client for this callback
  const oauthClient = createGoogleOAuthClient();

  // Exchange authorization code for tokens
  let tokens;

  try {
    const response = await oauthClient.getToken(code);
    tokens = response.tokens;
  } catch {
    throw createAppError(
      "Failed to exchange Google authorization code",
      502
    );
  }

  if (!tokens.access_token) {
    throw createAppError(
      "Google did not provide an access token",
      502
    );
  }

  oauthClient.setCredentials(tokens);

  // Retrieve Google account identity
  let googleUser;

  try {
    const oauth2 = google.oauth2({
      auth: oauthClient,
      version: "v2",
    });

    const response = await oauth2.userinfo.get();
    googleUser = response.data;
  } catch {
    throw createAppError(
      "Failed to retrieve Google account information",
      502
    );
  }

  if (
    !googleUser.id ||
    !googleUser.email ||
    !googleUser.verified_email
  ) {
    throw createAppError(
      "Unable to verify the connected Google account",
      401
    );
  }

  // Find an existing connection for this Google account
  const existingConnection =
    await prisma.oAuthConnection.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "GOOGLE",
          providerAccountId: googleUser.id,
        },
      },
    });

  // Prevent connecting another user's Google account
  if (
    existingConnection &&
    existingConnection.userId !== decodedState.sub
  ) {
    throw createAppError(
      "This Google account is already connected to another TaskFlow account",
      409
    );
  }

  // Preserve the previous refresh token if Google
  // doesn't issue a replacement.
  const refreshToken =
    tokens.refresh_token ??
    existingConnection?.refreshToken;

  if (!refreshToken) {
    throw createAppError(
      "Google did not provide a refresh token. Please retry authorization.",
      400
    );
  }

  const scopes =
    tokens.scope?.split(" ") ??
    existingConnection?.scopes ??
    CALENDAR_SCOPES;

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : existingConnection?.expiresAt ?? null;

  // Create or update the Calendar connection
  const connection = await prisma.oAuthConnection.upsert({
    where: {
      provider_providerAccountId: {
        provider: "GOOGLE",
        providerAccountId: googleUser.id,
      },
    },

    create: {
      userId: decodedState.sub,
      provider: "GOOGLE",
      providerAccountId: googleUser.id,
      accountEmail: googleUser.email,
      accessToken: tokens.access_token,
      refreshToken,
      expiresAt,
      scopes,
    },

    update: {
      accountEmail: googleUser.email,
      accessToken: tokens.access_token,
      refreshToken,
      expiresAt,
      scopes,
      status: "ACTIVE",
    },
  });

  // Recheck ownership in case another callback
  // created the connection concurrently.
  if (connection.userId !== decodedState.sub) {
    throw createAppError(
      "This Google account is already connected to another TaskFlow account",
      409
    );
  }

  // Never expose OAuth tokens to the frontend
  return res.status(200).json({
    status: "success",
    message: "Google Calendar connected successfully",
    data: {
      connection: {
        id: connection.id,
        provider: connection.provider,
        accountEmail: connection.accountEmail,
        scopes: connection.scopes,
        status: connection.status,
        expiresAt: connection.expiresAt,
      },
    },
  });
};
