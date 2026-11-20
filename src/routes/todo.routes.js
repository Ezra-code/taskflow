import { Router } from "express";
import {
  create,
  getAll,
  getOne,
  remove,
  setCompletion,
  update,
} from "../controllers/todo.controller.js";import validate from "../middleware/validate.js";
import authMiddleware from "../middleware/auth.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createTodoSchema, todoCompletionSchema, todoQuerySchema, updateTodoSchema } from "../validators/todo.validator.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validate(createTodoSchema),
  asyncHandler(create)
);

router.get(
  "/",
  authMiddleware,
  validate(todoQuerySchema, "query"),
  asyncHandler(getAll)
);

router.get(
  "/:id",
  authMiddleware,
  asyncHandler(getOne)
);

router.patch(
  "/:id",
  authMiddleware,
  validate(updateTodoSchema),
  asyncHandler(update)
);


router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(remove)
);

router.patch(
  "/:id/completion",
  authMiddleware,
  validate(todoCompletionSchema),
  asyncHandler(setCompletion)
);
export default router;