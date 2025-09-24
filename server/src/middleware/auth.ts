import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { getConfig } from '../config/config';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: { id: string };
}

export function authRequired(opts: { envelope?: boolean } = {}) {
  const { envelope = false } = opts;
  const unauthorized = (res: Response) =>
    envelope
      ? res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } })
      : res.status(401).json({ error: 'Unauthorized' });
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return unauthorized(res);
    try {
      const { JWT_SECRET } = getConfig();
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
      const user = await User.findById(payload.sub).lean();
      if (!user) return unauthorized(res);
      req.user = { id: user._id.toString() };
      return next();
    } catch {
      return unauthorized(res);
    }
  };
}
