const { validationResult } = require('express-validator');

/**
 * Runs after an array of express-validator checks.
 * If any failed, responds 400 with a consistent error shape; otherwise calls next().
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { validate };
