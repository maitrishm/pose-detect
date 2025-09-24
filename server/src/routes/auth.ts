import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { getConfig } from '../config/config';
import { connectDB } from '../db/connection';
import { User } from '../models/User';
import { Waitlist } from '../models/Waitlist';
import { authRequired, AuthRequest } from '../middleware/auth';
import { settingsSchema } from '../schemas/settings';

const router = Router();

function normalizeDelay(ms = 120) {
  return new Promise((r) => setTimeout(r, ms));
}

router.post('/auth/signup', async (req, res) => {
  await connectDB();
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || password.length < 8)
    return res.status(400).json({ error: 'Invalid input' });
  const existing = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existing) return res.status(409).json({ error: 'Email exists' });
  const { SIGNUP_CAP } = getConfig();
  const count = await User.countDocuments();
  if (count >= SIGNUP_CAP) return res.status(403).json({ error: 'Signup cap reached' });
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email: email.toLowerCase(), passwordHash });
  return res.status(201).json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      settings: user.settings,
    },
  });
});

router.post('/auth/login', async (req, res) => {
  await connectDB();
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Invalid input' });
  const start = Date.now();
  const user = await User.findOne({ email: email.toLowerCase() });
  let ok = false;
  if (user) {
    ok = await bcrypt.compare(password, user.passwordHash);
  } else {
    // fake hash compare to equalize timing
    await bcrypt.compare(password, '$2a$12$invalidsaltstringforconstanttimingxx');
  }
  const elapsed = Date.now() - start;
  const target = 120;
  if (elapsed < target) await normalizeDelay(target - elapsed);
  if (!ok || !user) return res.status(401).json({ error: 'Invalid credentials' });
  const { JWT_SECRET } = getConfig();
  const token = jwt.sign({ sub: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      settings: user.settings,
    },
  });
});

router.post('/auth/change-password', authRequired(), async (req: AuthRequest, res) => {
  await connectDB();
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 8)
    return res.status(400).json({ error: 'Invalid input' });
  const user = await User.findById(req.user!.id);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  return res.status(204).send();
});

router.post('/waitlist', async (req, res) => {
  await connectDB();
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Invalid input' });
  try {
    await Waitlist.create({ email: email.toLowerCase() });
  } catch {
    /* ignore duplicate */
  }
  return res.status(201).json({ ok: true });
});

router.get('/me', authRequired(), async (req: AuthRequest, res) => {
  await connectDB();
  const user = await User.findById(req.user!.id).lean();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      settings: user.settings,
    },
  });
});

router.get(
  '/settings',
  authRequired({ envelope: true }),
  async (req: AuthRequest, res) => {
    await connectDB();
    const user = await User.findById(req.user!.id).lean();
    if (!user)
      return res
        .status(401)
        .json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    return res.json({ settings: user.settings || {} });
  }
);

router.put(
  '/settings',
  authRequired({ envelope: true }),
  async (req: AuthRequest, res) => {
    await connectDB();
    const parse = settingsSchema.safeParse(req.body);
    if (!parse.success) {
      return res
        .status(400)
        .json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid settings',
            details: parse.error.flatten(),
          },
        });
    }
    const user = await User.findById(req.user!.id);
    if (!user)
      return res
        .status(401)
        .json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    user.settings = { ...(user.settings || {}), ...parse.data };
    await user.save();
    return res.json({ settings: user.settings });
  }
);

export default router;
