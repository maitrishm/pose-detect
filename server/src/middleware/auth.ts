import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { getConfig } from '../config/config';
import { User } from '../models/User';

export interface AuthRequest extends Request {
  user?: { id: string };
}

export function authRequired() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const { JWT_SECRET } = getConfig();
      const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
      const user = await User.findById(payload.sub).lean();
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      req.user = { id: user._id.toString() };
      return next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
