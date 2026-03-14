import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    message: "Привіт із сервера TypeScript!"
  });
});

export default router;