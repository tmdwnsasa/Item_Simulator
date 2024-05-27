import express from "express";
import { userPrisma } from "../utils/prisma/index.js";
import { gamePrisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/inventory/:Character_id", authMiddleware, async (req, res, next) => {
  const { Character_id } = req.params;

  if (req.user === null) {
    return res.status(401).json({ message: "사용자 인증이 필요합니다." });
  }

  const authorCharacter = await userPrisma.character.findFirst({
    where: {
      User_id: req.user.user_id,
    },
  });

  if (authorCharacter === null) {
    return res.status(401).json({ message: "사용자의 케릭터가 아닙니다." });
  }

  const inven = await userPrisma.Inventory.findMany({
    where: {
      Character_id: +Character_id,
    },
  });

  return res.status(200).json({ inven });
});

router.patch("/inventorybuy/:Character_id_inv", authMiddleware, async (req, res, next) => {
  const { character_id } = req.params;
  const itemDatas = req.body;

  //무결성 검사
  if (req.user === undefined) {
    return res.status(401).json({ message: "사용자 인증이 필요합니다." });
  }

  const authorCharacter = await userPrisma.character.findFirst({
    where: {
      User_id: req.user.user_id,
      character_id,
    },
  });

  if (!authorCharacter) {
    return res.status(401).json({ message: "사용자의 케릭터가 아닙니다." });
  }

  let sum = 0;
  for (const item of itemDatas) {
    const itemdetail = await gamePrisma.item.findFirst({
      where: {
        id: item.item_id,
      },
    });

    if (!itemdetail)
      return res.status(404).json({ message: "존재하지 않는 아이템은 구매할 수 없습니다." });
    if (item.count <= 0)
      return res.status(400).json({ message: "구매하려는 갯수가 잘못 입력되었습니다." });

    sum += item.count * itemdetail.price;
  }

  if (authorCharacter.money < sum) return res.status(400).json({ message: "돈이 부족합니다." });

  //데이터 입력
  for (const item of itemDatas) {
    const itemdetail = await gamePrisma.item.findFirst({
      where: {
        id: item.item_id,
      },
    });

    const inventory = await userPrisma.inventory.findFirst({
      where: {
        item_id: itemdetail.id,
      },
    });

    if (inventory === null) {
      await userPrisma.inventory.create({
        data: {
          item_id: item.item_id,
          count: item.count,
          Character_id: authorCharacter.character_id,
        },
      });
    } else {
      await userPrisma.inventory.update({
        where: {
          item_id: item.item_id,
        },
        data: {
          count: (inventory.count += item.count),
        },
      });
    }
  }

  await userPrisma.character.update({
    where: {
      character_id: authorCharacter.character_id,
    },
    data: {
      money: authorCharacter.money - sum,
    },
  });
  return res.status(200).json({ money: authorCharacter.money });
});

router.patch("/inventorysell/:Character_id_inv", authMiddleware, async (req, res, next) => {
  const { character_id } = req.params;
  const itemDatas = req.body;

  //무결성 검사
  if (req.user === undefined) {
    return res.status(401).json({ message: "사용자 인증이 필요합니다." });
  }

  const authorCharacter = await userPrisma.character.findFirst({
    where: {
      User_id: req.user.user_id,
      character_id,
    },
  });

  if (!authorCharacter) {
    return res.status(401).json({ message: "사용자의 케릭터가 아닙니다." });
  }

  let sum = 0;
  for (const item of itemDatas) {
    const itemdetail = await gamePrisma.item.findFirst({
      where: {
        id: item.item_id,
      },
    });

    const inventory = await userPrisma.inventory.findFirst({
      where: {
        item_id: itemdetail.id,
      },
    });

    if (!itemdetail)
      return res.status(404).json({ message: "존재하지 않는 아이템은 판매할 수 없습니다." });
    if (!inventory)
      return res.status(404).json({ message: "인벤토리에 없는 아이템은 판매할 수 없습니다." });
    if (item.count <= 0 || inventory.count < item.count) {
      return res.status(400).json({ message: "판매하려는 갯수가 잘못 입력되었습니다." });
    }
    sum += item.count * itemdetail.price;
  }

  //데이터 입력
  for (const item of itemDatas) {
    const itemdetail = await gamePrisma.item.findFirst({
      where: {
        id: item.item_id,
      },
    });

    const inventory = await userPrisma.inventory.findFirst({
      where: {
        Character_id: authorCharacter.character_id,
        item_id: itemdetail.id,
      },
    });
    console.log(inventory.count);
    if (inventory !== null) {
      await userPrisma.inventory.update({
        where: {
          item_id: item.item_id,
        },
        data: {
          count: (inventory.count -= item.count),
        },
      });
    }
    console.log(inventory.count);

    if (inventory.count === 0) {
      await userPrisma.inventory.delete({
        where: {
          item_id: item.item_id,
        },
      });
    }
  }

  await userPrisma.character.update({
    where: {
      character_id: authorCharacter.character_id,
    },
    data: {
      money: authorCharacter.money + sum,
    },
  });
  return res.status(200).json({ money: authorCharacter.money });
});

export default router;
