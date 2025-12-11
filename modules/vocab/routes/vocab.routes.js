import express from "express";
import {
  getVocab,
  getVocabById,
  createVocab,
  updateVocab,
  deleteVocab,
} from "../controllers/vocab.controller.js";
import validate from "../../../shared/middlewares/validate.js";
import { authenticate, authorize } from "../../../shared/middlewares/auth.js";
import {
  createVocabRules,
  updateVocabRules,
} from "../middlewares/validation.js";

const router = express.Router();

router.get("/", getVocab);
router.get("/:id", getVocabById);
router.post("/", authenticate, createVocabRules, validate, createVocab);
router.put("/:id", authenticate, updateVocabRules, validate, updateVocab);
router.delete("/:id", authenticate, deleteVocab);

export default router;
