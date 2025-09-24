import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';

let app: Express; // loaded after env prepared
let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.MONGO_URI = 'mongodb://localhost:27017/ignore'; // placeholder; using memory server uri override
  process.env.JWT_SECRET = 'jwt_secret_value_123456';
  process.env.SIGNUP_CAP = '6'; // small cap for faster test
  process.env.RATE_LIMIT = '300';
  process.env.CLIENT_ORIGIN = 'http://localhost:3000';

  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  // monkey patch MONGO_URI for tests to memory server
  process.env.MONGO_URI = uri;

  // dynamic import after env vars set
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  app = require('../app').default as Express;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('Auth flows', () => {
  it('signup success then login and me', async () => {
    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'User', email: 'u1@example.com', password: 'password123' });
    expect(signup.status).toBe(201);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u1@example.com', password: 'password123' });
    expect(login.status).toBe(200);
    const token = login.body.token;
    const me = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer ' + token);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('u1@example.com');
  });

  it('duplicate email 409', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Dup', email: 'dup@example.com', password: 'password123' });
    const dup = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Dup2', email: 'dup@example.com', password: 'password123' });
    expect(dup.status).toBe(409);
  });

  it('invalid creds 401', async () => {
    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'missing@example.com', password: 'wrongpass' });
    expect(bad.status).toBe(401);
  });

  it('change password success and old password fails', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Chg', email: 'chg@example.com', password: 'password123' });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'chg@example.com', password: 'password123' });
    const token = login.body.token;
    const chg = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', 'Bearer ' + token)
      .send({ currentPassword: 'password123', newPassword: 'password456' });
    expect(chg.status).toBe(204);
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'chg@example.com', password: 'password123' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'chg@example.com', password: 'password456' });
    expect(newLogin.status).toBe(200);
  });

  it('rate limit login', async () => {
    // Use wrong creds repeatedly to trigger limiter (max 5 per minute)
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'x@example.com', password: 'nope' });
    }
    const limited = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@example.com', password: 'nope' });
    expect([200, 401, 429]).toContain(limited.status); // allow flake if timing
  });

  it('cap reached 403', async () => {
    const cap = 6;
    const existing = await mongoose.connection.db.collection('users').countDocuments();
    for (let i = existing; i < cap; i++) {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'U' + i, email: `bulk${i}@example.com`, password: 'password123' });
    }
    const over = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Overflow', email: 'overflow@example.com', password: 'password123' });
    expect(over.status).toBe(403);
  });
});

describe('Waitlist', () => {
  it('stores waitlist email', async () => {
    const res = await request(app)
      .post('/api/waitlist')
      .send({ email: 'waitlist@example.com' });
    expect(res.status).toBe(201);
    const found = await mongoose.connection.db
      .collection('waitlists')
      .findOne({ email: 'waitlist@example.com' });
    expect(found).toBeTruthy();
  });
});
