import express from "express";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

router.get("/items", async (req, res) => {
  const datas = await prisma.item.findMany({
    select: {
      id: true,
      name: true,
      price: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  return res.status(200).json({ data: datas });
});

router.get("/items/:itemId", async (req, res) => {
  const itemId = Number(req.params.itemId);
  const isExistItem = await prisma.item.findFirst({
    where: {
      id: itemId,
    },
  });

  if (!isExistItem) {
    return res.status(404).json({ message: "존재하지 않는 아이템입니다." });
  }

  return res.status(200).json({ data: isExistItem });
});

router.post("/items", async (req, res, next) => {
  try {
    const { name, health, power, price } = req.body;
    const isExistItem = await prisma.item.findFirst({
      where: {
        name,
      },
    });

    if (isExistItem) {
      return res.status(409).json({ message: "이미 존재하는 아이템입니다." });
    }

    const item = await prisma.item.create({
      data: {
        name,
        health,
        power,
        price,
      },
    });

    return res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
});

router.patch("/items/:itemId", async (req, res, next) => {
  try {
    const bodyjson = req.body;
    const itemId = Number(req.params.itemId);
    console.log(itemId);
    const isExistItem = await prisma.item.findFirst({
      where: {
        id: itemId,
      },
    });

    if (isExistItem) {
      await prisma.item.update({
        data: {
          ...bodyjson,
        },
        where: {
          id: itemId,
        },
      });
    }
    return res.status(200).json({ bodyjson });
  } catch (err) {
    next(err);
  }
});

export default router;
