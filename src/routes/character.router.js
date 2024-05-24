import express from "express";
import { userPrisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/character/:character_id", authMiddleware, async (req, res, next) => {
  const { character_id } = req.params;
  let authorcheck = false;
  let author_user_id;

  const isExistId = await userPrisma.character.findFirst({
    where: {
      id: +character_id,
    },
  });

  if (req.user !== undefined) {
    author_user_id = req.user.user_id;
    if (author_user_id === isExistId.User_id) {
      authorcheck = true;
    }
  }

  const isExistUser = await userPrisma.character.findFirst({
    where: {
      id: +character_id,
    },
    select: {
      name: true,
      health: true,
      power: true,
      money: authorcheck,
    },
  });

  return res.status(200).json({ isExistUser });
});

router.post("/character", authMiddleware, async (req, res, next) => {
  const { name } = req.body;
  const { user_id } = req.user;
  if (user_id === undefined) {
    return res.status(401).json({ message: "로그인을 하지 않았습니다." });
  }
  const isExistUser = await userPrisma.character.findFirst({
    where: {
      name,
    },
  });

  if (isExistUser) return res.status(409).json({ message: "이미 있는 이름입니다." });
  const character = await userPrisma.character.create({
    data: {
      name: name,
      User_id: user_id,
    },
  });

  return res.status(200).json({ create: character });
});

router.delete("/character/:id", authMiddleware, async (req, res, next) => {
  const id = Number(req.params.id);
  const { user_id } = req.user;

  if (user_id === undefined) {
    return res.status(401).json({ message: "로그인을 하지 않았습니다." });
  }

  const isExistUser = await userPrisma.character.findFirst({
    where: {
      id,
      User_id: user_id,
    },
  });

  if (!isExistUser) return res.status(409).json({ message: "없는 케릭터 입니다." });
  const character = await userPrisma.character.delete({
    where: {
      id: id,
    },
  });

  return res.status(200).json({ delete: character });
});

export default router;
