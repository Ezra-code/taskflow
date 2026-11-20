import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
} from '../controllers/auth.controller.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import validate from '../middleware/validate.js';
import asyncHandler from '../utils/asyncHandler.js';
import passport from "../config/passport.js";
import { googleCallback } from "../controllers/googleAuth.controller.js";
import authMiddleware from '../middleware/auth.middleware.js';
import { handleCalendarCallback, initiateCalendarConnection } from '../controllers/googleCalendar.controller.js';
const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));

router.post('/refresh', asyncHandler(refresh));

router.post('/logout', asyncHandler(logout));
router.post('/logout-all', authMiddleware, asyncHandler(logoutAll));

router.get('/me', authMiddleware, asyncHandler(getMe));

// Start Google authentication
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  asyncHandler(googleCallback)
);


router.post(
  "/google/calendar",
  authMiddleware,
  initiateCalendarConnection
);

router.get(
  "/google/calendar/callback",
  asyncHandler(handleCalendarCallback)
);
export default router;
