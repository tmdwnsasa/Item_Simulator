import { PrismaClient as UserPrismaClient } from "../../../prisma/userDataClient/default.js";
import { PrismaClient as GamePrismaClient } from "../../../prisma/gameDataClient/default.js";

export const gamePrisma = new GamePrismaClient({
  log: ["query", "info", "warn", "error"],

  errorFormat: "pretty",
});

export const userPrisma = new UserPrismaClient({
  log: ["query", "info", "warn", "error"],

  errorFormat: "pretty",
});
