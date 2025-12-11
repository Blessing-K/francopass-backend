
import { body } from 'express-validator';

export const createExamRules = [

  body('examType').isString().notEmpty(),
  body('sections').isArray({ min: 1 }),
  body('difficulty').isString().notEmpty(),
  body('timer').isInt({ min: 60 })

];

export const updateExamRules = [

  body('examType').isString().notEmpty(),
  body('sections').isArray({ min: 1 }),
  body('difficulty').isString().notEmpty(),
  body('timer').isInt({ min: 60 })

];
