// backend/src/validation/user.ts
import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
    'any.required': 'E-Mail ist erforderlich'
  }),
  role: Joi.string().valid('developer', 'lead', 'office', 'teacher').required().messages({
    'any.only': 'Rolle muss einer der folgenden Werte sein: developer, lead, office, teacher',
    'any.required': 'Rolle ist erforderlich'
  }),
  locations: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': 'Mindestens ein Standort muss ausgewählt werden',
    'any.required': 'Standorte sind erforderlich'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
    'any.required': 'E-Mail ist erforderlich'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Passwort ist erforderlich'
  })
});

export const passwordResetSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token ist erforderlich'
  }),
  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Passwort muss mindestens 8 Zeichen lang sein',
      'any.required': 'Neues Passwort ist erforderlich'
    })
});
