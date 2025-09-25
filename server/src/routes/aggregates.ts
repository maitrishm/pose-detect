import { Router } from 'express';
import { Types } from 'mongoose';

import { connectDB } from '../db/connection';
import { authRequired, AuthRequest } from '../middleware/auth';
import { Aggregate } from '../models/Aggregate';
import { Session } from '../models/Session';
import { aggregateCreateSchema, aggregateUpdateSchema } from '../schemas/aggregate';

const router = Router();

// Create aggregate (unique per session)
router.post(
  '/aggregates',
  authRequired({ envelope: true }),
  async (req: AuthRequest, res) => {
    await connectDB();
    const parsed = aggregateCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid aggregate',
            details: parsed.error.flatten(),
          },
        });
    }
    const { sessionId, metrics } = parsed.data;
    if (!Types.ObjectId.isValid(sessionId))
      return res
        .status(400)
        .json({ error: { code: 'INVALID_ID', message: 'Invalid session id' } });
    const sid = new Types.ObjectId(sessionId);
    const session = await Session.findOne({ _id: sid, userId: req.user!.id }).lean();
    if (!session)
      return res
        .status(404)
        .json({ error: { code: 'NOT_FOUND', message: 'Session not found' } });
    const existing = await Aggregate.findOne({ sessionId: sid, userId: req.user!.id });
    if (existing)
      return res
        .status(409)
        .json({ error: { code: 'ALREADY_EXISTS', message: 'Aggregate exists' } });
    const doc = await Aggregate.create({
      sessionId: sid,
      userId: new Types.ObjectId(req.user!.id),
      metrics,
    });
    return res
      .status(201)
      .json({
        aggregate: {
          sessionId: doc.sessionId.toString(),
          metrics: doc.metrics,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        },
      });
  }
);

// Get aggregate by sessionId
router.get(
  '/aggregates/:sessionId',
  authRequired({ envelope: true }),
  async (req: AuthRequest, res) => {
    await connectDB();
    const { sessionId } = req.params;
    if (!Types.ObjectId.isValid(sessionId))
      return res
        .status(400)
        .json({ error: { code: 'INVALID_ID', message: 'Invalid session id' } });
    const doc = await Aggregate.findOne({ sessionId, userId: req.user!.id }).lean();
    if (!doc)
      return res
        .status(404)
        .json({ error: { code: 'NOT_FOUND', message: 'Aggregate not found' } });
    return res.json({
      aggregate: {
        sessionId: doc.sessionId.toString(),
        metrics: doc.metrics,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  }
);

// Update aggregate metrics (replace or merge - we'll merge shallow)
router.put(
  '/aggregates/:sessionId',
  authRequired({ envelope: true }),
  async (req: AuthRequest, res) => {
    await connectDB();
    const { sessionId } = req.params;
    if (!Types.ObjectId.isValid(sessionId))
      return res
        .status(400)
        .json({ error: { code: 'INVALID_ID', message: 'Invalid session id' } });
    const parsed = aggregateUpdateSchema.safeParse(req.body);
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
    const agg = await Aggregate.findOne({ sessionId, userId: req.user!.id });
    if (!agg)
      return res
        .status(404)
        .json({ error: { code: 'NOT_FOUND', message: 'Aggregate not found' } });
    agg.metrics = { ...(agg.metrics || {}), ...parsed.data.metrics };
    await agg.save();
    return res.json({
      aggregate: {
        sessionId: agg.sessionId.toString(),
        metrics: agg.metrics,
        createdAt: agg.createdAt,
        updatedAt: agg.updatedAt,
      },
    });
  }
);

export default router;
