const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  deactivateAccount,
} = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validate,
  login
);

router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

router.post('/forgot-password', [body('email').isEmail()], validate, forgotPassword);
router.put(
  '/reset-password/:token',
  [body('password').isLength({ min: 8 })],
  validate,
  resetPassword
);

router.put('/profile', protect, updateProfile);
router.put('/deactivate', protect, deactivateAccount);

module.exports = router;
