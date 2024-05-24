import express from "express";
import { userPrisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/character", authMiddleware, async (req, res, next) => {
  return res.status(200).json({ message: "히히" });
});

export default router;
