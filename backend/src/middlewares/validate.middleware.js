const { BadRequestError } = require('../utils/errors');

/**
 * Zod validation middleware factory.
 * Validates req.body against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/endpoint', validate(mySchema), controller);
 */
function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestError(
        `Validation failed: ${errors.map((e) => e.message).join(', ')}`
      );
    }

    // Replace body with parsed (and transformed) data
    req.body = result.data;
    next();
  };
}

module.exports = validate;
