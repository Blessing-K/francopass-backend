import express from "express";
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "../controllers/resource.controller.js";
import validate from "../../../shared/middlewares/validate.js";
import { authenticate, authorize } from "../../../shared/middlewares/auth.js";
import {
  createResourceRules,
  updateResourceRules,
} from "../middlewares/validation.js";

const router = express.Router();

router.get("/", getResources);
router.get("/:id", getResourceById);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  createResourceRules,
  validate,
  createResource
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  updateResourceRules,
  validate,
  updateResource
);
router.delete("/:id", authenticate, authorize("admin"), deleteResource);

export default router;
