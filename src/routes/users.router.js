import express from "express";

const router = express.Router();

router.get("/users", async (req, res) => {
  return res.status(200).json({ message: "어 그래 user 형이야" });
});

export default router;
