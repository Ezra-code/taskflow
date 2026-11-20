import { Router } from "express";
import { register, login, refresh, logout, logoutAll, getMe } from "../controllers/auth.controller.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import validate from "../middleware/validate.js";
import asyncHandler from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/auth.middleware.js";
const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(register)
);
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(login)
);

router.post(
  "/refresh",
  asyncHandler(refresh)
);

router.post(
  "/logout",
  asyncHandler(logout)
);
router.post(
  "/logout-all",
  authMiddleware,
  asyncHandler(logoutAll)
);

router.get(
  "/me",
  authMiddleware,
  asyncHandler(getMe)
);
export default router;