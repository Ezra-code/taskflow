import { generateAccessToken } from "../utils/token.js";
import { createSession } from "../services/session.service.js";

export const googleCallback = async (req, res) => {
  const user = req.user;

  const accessToken = generateAccessToken(user.id);
  const refreshToken = await createSession(user.id);

  res.status(200).json({
    status: "success",
    message: "Google authentication successful",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
};