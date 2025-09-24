import mongoose from 'mongoose';

import { getConfig } from '../config/config';

let cachedPromise: Promise<typeof mongoose> | null = null;
let isConnected = false;

interface RetryOptions {
  retries?: number;
  delayMs?: number;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function connectDB(opts: RetryOptions = {}): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) return mongoose;
  if (cachedPromise) return cachedPromise;

  const { MONGO_URI } = getConfig();
  const { retries = 3, delayMs = 500 } = opts;

  cachedPromise = (async () => {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        await mongoose.connect(MONGO_URI, {
          autoIndex: true,
          maxPoolSize: 5,
        });
        isConnected = true;
        return mongoose;
      } catch (err) {
        if (attempt > retries) {
          cachedPromise = null;
          throw err;
        }
        await sleep(delayMs * attempt);
      }
    }
    throw new Error('Failed to connect to MongoDB');
  })();

  return cachedPromise;
}

export function disconnectDB() {
  cachedPromise = null;
  isConnected = false;
  return mongoose.disconnect();
}
