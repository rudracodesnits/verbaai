const { z } = require('zod');

/**
 * Zod schemas for AI/NLP endpoints.
 */

const textInputSchema = z.object({
  text: z
    .string()
    .min(1, 'Text is required')
    .max(10000, 'Text must not exceed 10,000 characters')
    .trim(),
});

module.exports = {
  textInputSchema,
};
