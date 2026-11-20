import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must have at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});