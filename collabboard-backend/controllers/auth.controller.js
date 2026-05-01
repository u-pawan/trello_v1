const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 400);

  const user = await User.create({ name, email, password });
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new AppError('Invalid credentials', 401);

  const match = await user.comparePassword(password);
  if (!match) throw new AppError('Invalid credentials', 401);

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.json({
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email },
  });
};

const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const accessToken = generateAccessToken(decoded.id);
  res.json({ accessToken });
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
};

module.exports = { register, login, refreshToken, getMe };
