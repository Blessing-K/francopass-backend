import { body } from "express-validator";

export const createVocabRules = [
  body("word").isString().notEmpty(),
  body("definition").isString().notEmpty(),
  body("exampleSentence").optional().isString(),
  body("partOfSpeech").optional().isString(),
  body("difficultyLevel")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"]),
];

export const updateVocabRules = [
  body("word").optional().isString().notEmpty(),
  body("definition").optional().isString().notEmpty(),
  body("exampleSentence").optional().isString(),
  body("partOfSpeech").optional().isString(),
  body("difficultyLevel")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"]),
];
