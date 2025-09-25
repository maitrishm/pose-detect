import { Router } from 'express';
import { Types } from 'mongoose';

import { connectDB } from '../db/connection';
import { authRequired, AuthRequest } from '../middleware/auth';
import { Session } from '../models/Session';
import { sessionCreateSchema, sessionUpdateSchema } from '../schemas/session';

const router = Router();

// List sessions with pagination & optional mode filter
router.get(
  '/sessions',
  authRequired({ envelope: true }),
  async (req: AuthRequest, res) => {
    await connectDB();
    const {
      page = '1',
      limit = '20',
      mode,
    } = req.query as Record<string, string | undefined>;
    const p = Math.max(parseInt(page as string, 10) || 1, 1);
    const l = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(req.user!.id) };
    if (mode === 'partner' || mode === 'solo') filter.mode = mode;
    const [items, total] = await Promise.all([
      Session.find(filter)
        .sort({ startedAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      Session.countDocuments(filter),
    ]);
    return res.json({ page: p, limit: l, total, items });
  }
);

// Create session
router.post(
  '/sessions',
  authRequired({ envelope: true }),
  async (req: AuthRequest, res) => {
    await connectDB();
    const parsed = sessionCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid session',
            details: parsed.error.flatten(),
          },
        });
    }
    const data = parsed.data;
    const doc = await Session.create({
      userId: new Types.ObjectId(req.user!.id),
      mode: data.mode,
      startedAt: data.startedAt || new Date(),
      endedAt: data.endedAt,
      config: data.config || {},
    });
    // Attach optional title/notes inside config meta for now (not in schema model fields)
    if (data.title || data.notes) {
      doc.config = {
        ...(doc.config || {}),
        meta: { title: data.title, notes: data.notes },
      };
      await doc.save();
    }
    return res
      .status(201)
      .json({
        session: {
          id: doc._id.toString(),
          mode: doc.mode,
          startedAt: doc.startedAt,
          endedAt: doc.endedAt,
          config: doc.config,
        },
      });
  }
);

// Update session (title/notes, endedAt, config partial merge)
router.put(
  '/sessions/:id',
  authRequired({ envelope: true }),
  async (req: AuthRequest, res) => {
    await connectDB();
    const parsed = sessionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update',
            details: parsed.error.flatten(),
          },
        });
    }
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ error: { code: 'INVALID_ID', message: 'Invalid session id' } });
    const session = await Session.findOne({ _id: id, userId: req.user!.id });
    if (!session)
      return res
        .status(404)
        .json({ error: { code: 'NOT_FOUND', message: 'Session not found' } });
    const data = parsed.data;
    if (data.endedAt) session.endedAt = data.endedAt;
    if (data.config) session.config = { ...(session.config || {}), ...data.config };
    if (data.title || data.notes) {
      const existingConfig = (session.config || {}) as Record<string, unknown>;
      const meta = (existingConfig as { meta?: Record<string, unknown> }).meta || {};
      session.config = {
        ...(session.config || {}),
        meta: {
          ...meta,
          ...(data.title && { title: data.title }),
          ...(data.notes && { notes: data.notes }),
        },
      };
    }
    await session.save();
    return res.json({
      session: {
        id: session._id.toString(),
        mode: session.mode,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        config: session.config,
      },
    });
  }
);

// Delete session
router.delete(
  '/sessions/:id',
  authRequired({ envelope: true }),
  async (req: AuthRequest, res) => {
    await connectDB();
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ error: { code: 'INVALID_ID', message: 'Invalid session id' } });
    const deleted = await Session.findOneAndDelete({ _id: id, userId: req.user!.id });
    if (!deleted)
      return res
        .status(404)
        .json({ error: { code: 'NOT_FOUND', message: 'Session not found' } });
    return res.status(204).send();
  }
);

export default router;
