
import { generateAccessToken } from "../utils/token.js";
import { createSession } from "../services/session.service.js";

export const googleCallback = async (req, res) => {
  const user = req.user;

  const refreshToken = await createSession(user.id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });

  return res.redirect(
    `${process.env.FRONTEND_URL}/dashboard`
  );
};
