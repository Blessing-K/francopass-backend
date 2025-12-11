import express from "express";
import {
  getFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from "../controllers/feedback.controller.js";
import validate from "../../../shared/middlewares/validate.js";
import { authenticate, authorize } from "../../../shared/middlewares/auth.js";
import {
  createFeedbackRules,
  updateFeedbackRules,
} from "../middlewares/validation.js";

const router = express.Router();

router.get("/", getFeedback);
router.get("/:id", getFeedbackById);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  createFeedbackRules,
  validate,
  createFeedback
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  updateFeedbackRules,
  validate,
  updateFeedback
);
router.delete("/:id", authenticate, authorize("admin"), deleteFeedback);

export default router;
