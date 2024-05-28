import jwt from "jsonwebtoken";
import { userPrisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
  try {
    const authorization = req.header("Authorization");

    if (!authorization) {
      next();
      return;
    }

    const [tokenType, token] = authorization.split(" ");
    if (tokenType !== "Bearer") return res.status(401).json({ message: "베어러 토큰이 아닙니다." });

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
    const sign_up_id = decodedToken.sign_up_id;
    const user = await userPrisma.user.findFirst({
      where: { sign_up_id },
    });

    if (!user) {
      //throw new Error("토큰 사용자가 존재하지 않습니다.");
      next();
    }

    req.user = user;

    next();
  } catch (error) {
    switch (error.name) {
      case "TokenExpiredError":
        return res.status(401).json({ message: "토큰이 만료되었습니다." });
      case "JsonWebTokenError":
        return res.status(401).json({ message: "토큰이 조작되었습니다." });
      default:
        return res.status(401).json({ message: error.message ?? "비정상적인 요청입니다." });
    }
  }
}
