import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';

let app: Express;
let mongo: MongoMemoryServer;
let token: string;

beforeAll(async () => {
  process.env.MONGO_URI = 'mongodb://localhost:27017/ignore';
  process.env.JWT_SECRET = 'jwt_secret_value_123456';
  process.env.SIGNUP_CAP = '50';
  process.env.RATE_LIMIT = '300';
  process.env.CLIENT_ORIGIN = 'http://localhost:3000';

  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  app = require('../app').default as Express;

  // create user + token
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'S', email: 's@example.com', password: 'password123' });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 's@example.com', password: 'password123' });
  token = login.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('Settings API', () => {
  it('rejects unauthorized', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
    expect(res.body.error).toEqual({ code: 'UNAUTHORIZED', message: 'Unauthorized' });
  });

  it('gets default settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', 'Bearer ' + token);
    expect(res.status).toBe(200);
    expect(res.body.settings).toBeDefined();
  });

  it('validates update payload', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', 'Bearer ' + token)
      .send({ engine: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('updates settings', async () => {
    const payload = {
      engine: 'mediapipe',
      voice: 'basic',
      theme: 'dark',
      uiScale: 1,
      units: 'metric',
    };
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', 'Bearer ' + token)
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.settings.engine).toBe('mediapipe');
    const get = await request(app)
      .get('/api/settings')
      .set('Authorization', 'Bearer ' + token);
    expect(get.body.settings.theme).toBe('dark');
  });
});
