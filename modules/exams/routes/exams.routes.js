import express from "express";
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
} from "../controllers/exam.controller.js";
import validate from "../../../shared/middlewares/validate.js";
import { authenticate, authorize } from "../../../shared/middlewares/auth.js";
import { createExamRules, updateExamRules } from "../middlewares/validation.js";

const router = express.Router();

router.get("/", getExams);
router.get("/:id", getExamById);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  createExamRules,
  validate,
  createExam
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  updateExamRules,
  validate,
  updateExam
);
router.delete("/:id", authenticate, authorize("admin"), deleteExam);

export default router;
