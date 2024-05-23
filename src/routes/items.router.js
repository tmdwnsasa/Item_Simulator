import express from "express";

const router = express.Router();

router.get("/items", async (req, res) => {
  return res.status(200).json({ message: "어 그래 item 형이야" });
});

export default router;
