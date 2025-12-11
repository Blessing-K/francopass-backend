import { body } from "express-validator";

export const createResourceRules = [
  body("title").isString().notEmpty(),
  body("url").isURL(),
  body("resourceType").isIn(["article", "video", "book", "course"]),
  body("languageLevel")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"]),
  body("description").optional().isString(),
];

export const updateResourceRules = [
  body("title").optional().isString().notEmpty(),
  body("url").optional().isURL(),
  body("resourceType").optional().isIn(["article", "video", "book", "course"]),
  body("languageLevel")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"]),
  body("description").optional().isString(),
];
