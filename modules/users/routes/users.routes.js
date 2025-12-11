import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../../../shared/middlewares/auth.js";
import validate from "../../../shared/middlewares/validate.js";
import { createUserRules, updateUserRules } from "../middlewares/validation.js";

const router = express.Router();

router.get("/", authenticate, authorize("admin"), getUsers);
router.get("/:id", authenticate, getUserById);
router.post("/", createUserRules, validate, createUser);
router.put("/:id", authenticate, updateUserRules, validate, updateUser);
router.delete("/:id", authenticate, authorize("admin"), deleteUser);

export default router;
