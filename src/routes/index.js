
import { Router } from "express";
import authRouter from "./auth.routes.js";
import todoRouter from "./todo.routes.js";


const router = Router();

router.use("/auth", authRouter);
router.use("/todos", todoRouter);
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "TaskFlow API is healthy",
  });
});

export default router;
