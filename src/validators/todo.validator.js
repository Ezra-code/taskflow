
import { z } from "zod";

export const createTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
});


export const updateTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title cannot exceed 150 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided"
);

export const todoCompletionSchema = z.object({
  completed: z.boolean(),
});

export const todoQuerySchema = z.object({
  completed: z.enum(["true", "false"]).optional(),

  sortBy: z
    .enum(["createdAt", "updatedAt", "title", "completed"])
    .optional(),

  sortOrder: z.enum(["asc", "desc"]).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});