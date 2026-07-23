const { ApiError } = require('./error.middleware');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, 'Datos inválidos', details));
    }

    if (result.data.body) req.body = result.data.body;
    // req.query is a getter-only property in Express 5, it can't be reassigned
    if (result.data.query) req.validatedQuery = result.data.query;

    next();
  };
}

module.exports = { validate };
