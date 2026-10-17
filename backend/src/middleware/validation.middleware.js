const { error } = require('../utils/response.utils');

/**
 * Zod request validation middleware
 * @param {import('zod').ZodSchema} schema 
 * @param {'body'|'query'|'params'} source 
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const issues = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return error(res, 'Validation error', 400, issues);
      }
      return error(res, 'Invalid request data', 400);
    }
  };
}

module.exports = {
  validate
};
