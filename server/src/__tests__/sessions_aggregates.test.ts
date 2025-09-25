import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';

let app: Express;
let mongo: MongoMemoryServer;
let userToken: string;
let otherToken: string;
let sessionId: string;

beforeAll(async () => {
  process.env.MONGO_URI = 'mongodb://localhost:27017/ignore';
  process.env.JWT_SECRET = 'jwt_secret_value_123456';
  process.env.SIGNUP_CAP = '50';
  process.env.RATE_LIMIT = '300';
  process.env.CLIENT_ORIGIN = 'http://localhost:3000';

  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  const imported = await import('../app');
  app = imported.default as Express;

  // create two users
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'A', email: 'a@example.com', password: 'password123' });
  const loginA = await request(app)
    .post('/api/auth/login')
    .send({ email: 'a@example.com', password: 'password123' });
  userToken = loginA.body.token;
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'B', email: 'b@example.com', password: 'password123' });
  const loginB = await request(app)
    .post('/api/auth/login')
    .send({ email: 'b@example.com', password: 'password123' });
  otherToken = loginB.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('Sessions lifecycle', () => {
  it('creates session', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', 'Bearer ' + userToken)
      .send({
        mode: 'partner',
        title: 'Morning Roll',
        notes: 'Felt good',
        config: { goals: ['control'] },
      });
    expect(res.status).toBe(201);
    expect(res.body.session.id).toBeDefined();
    sessionId = res.body.session.id;
  });

  it('lists sessions with pagination', async () => {
    const res = await request(app)
      .get('/api/sessions?page=1&limit=10')
      .set('Authorization', 'Bearer ' + userToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('updates session meta', async () => {
    const res = await request(app)
      .put('/api/sessions/' + sessionId)
      .set('Authorization', 'Bearer ' + userToken)
      .send({
        title: 'Updated Title',
        notes: 'New notes',
        endedAt: new Date().toISOString(),
      });
    expect(res.status).toBe(200);
    expect(res.body.session.config.meta.title).toBe('Updated Title');
  });

  it('prevents other user from deleting', async () => {
    const res = await request(app)
      .delete('/api/sessions/' + sessionId)
      .set('Authorization', 'Bearer ' + otherToken);
    expect(res.status).toBe(404); // not found to avoid leakage
  });
});

describe('Aggregates lifecycle', () => {
  it('creates aggregate for session', async () => {
    const res = await request(app)
      .post('/api/aggregates')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ sessionId, metrics: { controlPct: 0.6 } });
    expect(res.status).toBe(201);
  });

  it('rejects duplicate aggregate', async () => {
    const res = await request(app)
      .post('/api/aggregates')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ sessionId, metrics: { controlPct: 0.7 } });
    expect(res.status).toBe(409);
  });

  it('gets aggregate', async () => {
    const res = await request(app)
      .get('/api/aggregates/' + sessionId)
      .set('Authorization', 'Bearer ' + userToken);
    expect(res.status).toBe(200);
    expect(res.body.aggregate.metrics.controlPct).toBe(0.6);
  });

  it('updates aggregate metrics (merge)', async () => {
    const res = await request(app)
      .put('/api/aggregates/' + sessionId)
      .set('Authorization', 'Bearer ' + userToken)
      .send({ metrics: { transitions: 5 } });
    expect(res.status).toBe(200);
    expect(res.body.aggregate.metrics.transitions).toBe(5);
    expect(res.body.aggregate.metrics.controlPct).toBe(0.6);
  });

  it('prevents other user access', async () => {
    const res = await request(app)
      .get('/api/aggregates/' + sessionId)
      .set('Authorization', 'Bearer ' + otherToken);
    expect(res.status).toBe(404);
  });
});
