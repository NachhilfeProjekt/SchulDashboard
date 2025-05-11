import Joi from 'joi';
import { UserRole } from '../models/User';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid(...Object.values(UserRole)).required(),
  locations: Joi.array().items(Joi.string().uuid()).min(1).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

export const passwordResetSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, one lowercase, one number and one special character'
    })
});