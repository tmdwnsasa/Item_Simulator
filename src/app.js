import express from "express";
import errorHandlingMiddleware from "./middlewares/error-handling.middleware.js";
import UsersRouter from "./routes/users.router.js";
import ItemsRouter from "./routes/items.router.js";
import CharacterRouter from "./routes/character.router.js";
import InventoryRouter from "./routes/inventory.router.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use("/api", [UsersRouter, ItemsRouter, CharacterRouter, InventoryRouter]);

app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸다~");
});
