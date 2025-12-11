import express from "express";
import {
  login,
  verifyOtp,
  me,
  debugSmtp,
} from "../controllers/auth.controller.js";
import { authenticate } from "../../../shared/middlewares/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.get("/me", authenticate, me);

// Dev-only SMTP debug endpoint — returns transporter.verify() details.
router.get("/debug-smtp", debugSmtp);

export default router;
