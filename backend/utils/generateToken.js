const jwt = require('jsonwebtoken');

/** Signs a JWT for the given user id. */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/** Sets the JWT as an httpOnly cookie AND returns it in the JSON body (flexible for SPA + mobile clients). */
const sendTokenResponse = (user, statusCode, res, extra = {}) => {
  const token = generateToken(user._id);

  const cookieDays = Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 7);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
  });

  const safeUser = user.toObject ? user.toObject() : user;
  delete safeUser.password;

  res.status(statusCode).json({
    success: true,
    token,
    user: safeUser,
    ...extra,
  });
};

module.exports = { generateToken, sendTokenResponse };
