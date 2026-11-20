
import jwt from "jsonwebtoken";
import { randomBytes, timingSafeEqual } from "node:crypto";

const STATE_EXPIRY = "5m";

export const generateOAuthState = (userId) => {
  const nonce = randomBytes(32).toString("hex");

  const state = jwt.sign(
    { nonce },
    process.env.GOOGLE_OAUTH_STATE_SECRET,
    {
      subject: userId,
      expiresIn: STATE_EXPIRY,
    }
  );

  return { state, nonce };
};

export const verifyOAuthState = (state) =>
  jwt.verify(state, process.env.GOOGLE_OAUTH_STATE_SECRET);

export const validateOAuthState = (state, cookieNonce) => {
  if (
    typeof state !== "string" ||
    typeof cookieNonce !== "string"
  ) {
    throw new Error("Invalid OAuth state");
  }

  const decoded = verifyOAuthState(state);

  if (
    typeof decoded === "string" ||
    typeof decoded.sub !== "string" ||
    typeof decoded.nonce !== "string"
  ) {
    throw new Error("Invalid OAuth state payload");
  }

  const expected = Buffer.from(decoded.nonce);
  const received = Buffer.from(cookieNonce);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new Error("OAuth state verification failed");
  }

  return decoded;
};
