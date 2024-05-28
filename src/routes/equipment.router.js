import express from "express";
import { userPrisma } from "../utils/prisma/index.js";
import { gamePrisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/equipment/:Character_id", async (req, res, next) => {
  const { Character_id } = req.params;
  const data = [];

  const equipment = await userPrisma.equipment.findMany({
    where: {
      Character_id: +Character_id,
    },
  });

  for (const item of equipment) {
    data.push(
      await gamePrisma.item.findFirst({
        where: {
          id: item.item_id,
        },
        select: {
          id: true,
          name: true,
        },
      }),
    );
  }

  return res.status(200).json({ result: data });
});

router.post("/equipmentequip/:Character_id", authMiddleware, async (req, res, next) => {
  const { Character_id } = req.params;
  const itemDatas = req.body;

  //무결성 검사
  if (!req.user) {
    return res.status(401).json({ message: "사용자 인증이 필요합니다." });
  }

  const authorCharacter = await userPrisma.character.findFirst({
    where: {
      User_id: req.user.user_id,
      character_id: +Character_id,
    },
  });

  if (!authorCharacter) {
    return res.status(401).json({ message: "사용자의 케릭터가 아닙니다." });
  }

  for (const item of itemDatas) {
    const itemdetail = await gamePrisma.item.findFirst({
      where: {
        id: item.item_id,
      },
    });

    if (!itemdetail)
      return res.status(404).json({ message: "존재하지 않는 아이템은 장착할 수 없습니다." });

    const equipment = await userPrisma.equipment.findFirst({
      where: {
        Character_id: authorCharacter.character_id,
        item_id: itemdetail.id,
      },
    });

    const inventory = await userPrisma.inventory.findFirst({
      where: {
        Character_id: authorCharacter.character_id,
        item_id: itemdetail.id,
      },
    });

    if (equipment) return res.status(400).json({ message: "이미 장착한 아이템입니다" });
    if (!inventory) return res.status(400).json({ message: "인벤토리에 존재하지 않습니다" });
  }

  const result = [];
  await userPrisma.$transaction(
    async (tx) => {
      for (const item of itemDatas) {
        const itemdetail = await gamePrisma.item.findFirst({
          where: {
            id: item.item_id,
          },
        });

        result.push(
          await tx.equipment.create({
            data: {
              Character_id: authorCharacter.character_id,
              item_id: item.item_id,
            },
          }),
        );

        const inventory = await userPrisma.inventory.findFirst({
          where: {
            Character_id: authorCharacter.character_id,
            item_id: item.item_id,
          },
        });

        if (inventory.count === 1) {
          await tx.inventory.deleteMany({
            where: {
              Character_id: authorCharacter.character_id,
              item_id: item.item_id,
            },
          });
        } else {
          await tx.inventory.updateMany({
            where: {
              Character_id: authorCharacter.character_id,
              item_id: item.item_id,
            },
            data: {
              count: inventory.count - 1,
            },
          });
        }

        await tx.character.update({
          where: {
            character_id: authorCharacter.character_id,
          },
          data: {
            health: (authorCharacter.health += itemdetail.health),
            power: (authorCharacter.power += itemdetail.power),
          },
        });
      }
    },
    {
      isolationLevel: "ReadCommitted",
    },
  );

  return res.status(200).json(result);
});

router.delete("/equipmentunequip/:Character_id", authMiddleware, async (req, res, next) => {
  const { Character_id } = req.params;
  const itemDatas = req.body;

  //무결성 검사
  if (!req.user) {
    return res.status(401).json({ message: "사용자 인증이 필요합니다." });
  }

  const authorCharacter = await userPrisma.character.findFirst({
    where: {
      User_id: req.user.user_id,
      character_id: +Character_id,
    },
  });

  if (!authorCharacter) {
    return res.status(401).json({ message: "사용자의 케릭터가 아닙니다." });
  }

  for (const item of itemDatas) {
    const itemdetail = await gamePrisma.item.findFirst({
      where: {
        id: item.item_id,
      },
    });

    if (!itemdetail)
      return res.status(404).json({ message: "존재하지 않는 아이템은 장착할 수 없습니다." });

    const equipment = await userPrisma.equipment.findFirst({
      where: {
        Character_id: authorCharacter.character_id,
        item_id: itemdetail.id,
      },
    });

    if (!equipment) return res.status(400).json({ message: "장착하지 않은 아이템입니다" });
  }

  const result = [];

  await userPrisma.$transaction(
    async (tx) => {
      for (const item of itemDatas) {
        const itemdetail = await gamePrisma.item.findFirst({
          where: {
            id: item.item_id,
          },
        });

        result.push(
          await tx.equipment.deleteMany({
            where: {
              Character_id: authorCharacter.character_id,
              item_id: item.item_id,
            },
          }),
        );

        const inventory = await userPrisma.inventory.findFirst({
          where: {
            Character_id: authorCharacter.character_id,
            item_id: item.item_id,
          },
        });

        if (!inventory) {
          await tx.inventory.create({
            data: {
              Character_id: authorCharacter.character_id,
              item_id: 1,
            },
          });
        } else {
          await tx.inventory.updateMany({
            where: {
              Character_id: authorCharacter.character_id,
              item_id: item.item_id,
            },
            data: {
              count: inventory.count + 1,
            },
          });
        }

        await tx.character.update({
          where: {
            character_id: authorCharacter.character_id,
          },
          data: {
            health: (authorCharacter.health -= itemdetail.health),
            power: (authorCharacter.power -= itemdetail.power),
          },
        });
      }
    },
    {
      isolationLevel: "ReadCommitted",
    },
  );

  return res.status(200).json(result);
});

export default router;
