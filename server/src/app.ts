import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import createError from 'http-errors';

// Load config early (will exit if invalid)
import { getConfig } from './config/config';
const { CLIENT_ORIGIN } = getConfig();

const app = express();

// Basic security & logging
app.use(helmet());
app.use(morgan('dev'));

// Explicit allowlist gate before cors (returns 403 JSON)
app.use((req, res, next) => {
  if (!CLIENT_ORIGIN) return next();
  const origin = req.headers.origin as string | undefined;
  if (!origin || origin === CLIENT_ORIGIN) return next();
  return res.status(403).json({ error: 'CORS: origin not allowed' });
});

// Apply CORS (will still set headers for allowed origins)
app.use(
  cors({
    origin: (_origin, cb) => cb(null, true), // already filtered
    credentials: true,
  })
);

// Rate limiter (generic)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: '1mb' }));

// Health route
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// 404
app.use((_req, _res, next) => {
  next(new createError.NotFound());
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err as { status?: number; message?: string };
  const status = e.status || 500;
  res.status(status).json({ error: e.message || 'Server Error' });
});

export default app;
