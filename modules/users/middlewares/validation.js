import { body } from "express-validator";

export const createUserRules = [
  body("username").isString().notEmpty(),
  body("email").isEmail(),
  body("password").isString().isLength({ min: 6 }),
  body("subscription").optional().isIn(["free", "premium"]),
];

export const updateUserRules = [
  body("username").optional().isString().notEmpty(),
  body("email").optional().isEmail(),
  body("password").optional().isString().isLength({ min: 6 }),
  body("subscription").optional().isIn(["free", "premium"]),
];
