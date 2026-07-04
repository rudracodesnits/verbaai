const { z } = require('zod');

/**
 * Zod schemas for authentication endpoints.
 */

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters'),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'Key name is required')
    .max(50, 'Key name must not exceed 50 characters')
    .trim()
    .default('Default'),
  scopes: z
    .array(z.enum(['summarize', 'sentiment', 'toxicity', 'keywords', 'chat']))
    .min(1, 'At least one scope is required')
    .default(['summarize', 'sentiment', 'toxicity', 'keywords', 'chat']),
  expiresInDays: z
    .number()
    .nullable()
    .optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

module.exports = {
  registerSchema,
  loginSchema,
  createApiKeySchema,
  verifyOtpSchema,
  resendOtpSchema,
};
