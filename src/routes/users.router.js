import express from "express";
import { userPrisma } from "../utils/prisma/index.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

router.post("/users/sign_up", async (req, res, next) => {
  try {
    var regex = /^[a-z0-9]*$/;
    const { sign_up_id, name, password, password_confirm } = req.body;
    const isExistUser = await userPrisma.user.findFirst({
      where: {
        sign_up_id,
      },
    });

    if (!regex.test(sign_up_id))
      return res.status(400).json({ message: "아이디는 영어 소문자, 숫자로만 이루어져야 합니다." });
    if (isExistUser) return res.status(409).json({ message: "이미 존재하는 아이디입니다." });
    if (password !== password_confirm)
      return res.status(400).json({ message: "비밀번호가 비밀번호 확인과 일치하지 않습니다." });
    if (password.length < 6)
      return res.status(400).json({ message: "비밀번호가 6자리 이상 이여야 합니다." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userPrisma.user.create({
      data: {
        name,
        sign_up_id,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ name: user.name, sign_up_id: user.sign_up_id });
  } catch (err) {
    next(err);
  }
});

router.post("/users/sign_in", async (req, res, next) => {
  try {
    const { sign_up_id, password } = req.body;

    const isExistUser = await userPrisma.user.findFirst({
      where: {
        sign_up_id,
      },
    });

    if (!isExistUser) return res.status(404).json({ message: "등록 되지 않은 아이디입니다." });
    if (!(await bcrypt.compare(password, isExistUser.password)))
      return res.status(401).json({ message: "비밀번호가 같지 않습니다." });

    const accessToken = `Bearer ${createAccessToken(sign_up_id)}`;
    res.header("Authorization", `Bearer ${accessToken}`);

    return res.status(200).json({ message: accessToken });
  } catch {}
});

function createAccessToken(sign_up_id) {
  const accessToken = jwt.sign({ sign_up_id }, process.env.ACCESS_TOKEN_SECRET_KEY, {
    expiresIn: "1d",
  });

  return accessToken;
}

export default router;
