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
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
});

const chatInputSchema = z.object({
  context: z
    .string()
    .min(1, 'Context text is required')
    .max(10000, 'Context text must not exceed 10,000 characters')
    .trim(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1).max(5000),
    })
  ).min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
});

module.exports = {
  textInputSchema,
  chatInputSchema,
};
