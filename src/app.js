import express from "express";
import UsersRouter from "./routes/users.router.js";
import ItemsRouter from "./routes/items.router.js";

const PORT = 3000;

const app = express();

app.use("/api", [UsersRouter, ItemsRouter]);

app.get("/", async (req, res) => {
  return res.status(200).json({ message: "어 그래 형이야" });
});

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸다~");
});