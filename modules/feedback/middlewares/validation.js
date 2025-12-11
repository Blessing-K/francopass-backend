import { body } from "express-validator";

export const createFeedbackRules = [
  body("userId").isMongoId(),
  body("message").isString().notEmpty(),
  body("rating").optional().isInt({ min: 1, max: 5 }),
];

export const updateFeedbackRules = [
  body("userId").optional().isMongoId(),
  body("message").optional().isString().notEmpty(),
  body("rating").optional().isInt({ min: 1, max: 5 }),
];
