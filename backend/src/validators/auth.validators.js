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
});

module.exports = {
  registerSchema,
  loginSchema,
  createApiKeySchema,
};
