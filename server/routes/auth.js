import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { wrap, fail } from '../utils.js';
const r = Router();
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const out = (u) => ({ id: u._id, name: u.name, email: u.email });

r.post('/register', wrap(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (await User.findOne({ email: String(email || '').toLowerCase().trim() })) fail(409, 'Email already registered');
  const u = await User.create({ name, email, password });
  res.status(201).json({ token: sign(u), user: out(u) });
}));

r.post('/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) fail(400, 'Email and password are required');
  const u = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!u || !(await u.matches(String(password)))) fail(401, 'Invalid email or password');
  res.json({ token: sign(u), user: out(u) });
}));

r.get('/me', protect, (req, res) => res.json({ user: out(req.user) }));
export default r;
