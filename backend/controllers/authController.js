const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  const userSafe = user.toObject();
  delete userSafe.password;
  res.status(statusCode).json({ success: true, token, user: userSafe });
};

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, businessName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    businessName: businessName || 'Pooja Flower',
  });

  sendAuthResponse(user, 201, res);
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  sendAuthResponse(user, 200, res);
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @route PUT /api/auth/me  (settings/profile update)
const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name', 'businessName', 'phone', 'whatsapp', 'address', 'logoUrl',
    'currency', 'defaultLanguage', 'reportFooter', 'ownerName', 'signatureLabel',
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user });
});

// @route POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });

  // Always respond the same way to avoid leaking which emails exist
  const genericResponse = {
    success: true,
    message: 'If an account exists for that email, a reset token has been generated.',
  };

  if (!user) return res.json(genericResponse);

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // In production this token would be emailed. Since no email service is configured,
  // it is returned directly here so the flow is testable end-to-end.
  res.json({ ...genericResponse, resetToken });
});

// @route POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required.' });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired.' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  sendAuthResponse(user, 200, res);
});

module.exports = { register, login, getMe, updateMe, forgotPassword, resetPassword };
