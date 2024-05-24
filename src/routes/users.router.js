import express from "express";
import { userPrisma } from "../utils/prisma/index.js";

const router = express.Router();

router.get("/users", async (req, res) => {
  const datas = await userPrisma.user.findMany({
    select: {
      sign_up_id: true,
      name: true,
      password: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return res.status(200).json({ data: datas });
});

router.post("/users", async (req, res, next) => {
  try {
    const { sign_up_id, name, password } = req.body;
    const isExistItem = await userPrisma.user.findFirst({
      where: {
        sign_up_id,
      },
    });

    if (isExistItem) {
      return res.status(409).json({ message: "이미 존재하는 아이템입니다." });
    }

    const item = await userPrisma.user.create({
      data: {
        name,
        sign_up_id,
        password,
      },
    });

    return res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
});

router.get("/users", async (req, res) => {
  return res.status(200).json({ message: "어 그래 user 형이야" });
});

export default router;
