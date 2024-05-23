import express from "express";
import errorHandlingMiddleware from "./middlewares/error-handling.middleware.js";
import UsersRouter from "./routes/users.router.js";
import ItemsRouter from "./routes/items.router.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/api", [UsersRouter, ItemsRouter]);

app.get("/", async (req, res) => {
  return res.status(200).json({ message: "어 그래 형이야" });
});

app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸다~");
});
