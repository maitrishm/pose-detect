import request from 'supertest';

process.env.MONGO_URI = 'mongodb://localhost:27017/test';
process.env.JWT_SECRET = 'test_jwt_secret_value_123456';
process.env.SIGNUP_CAP = '50';
process.env.RATE_LIMIT = '300';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';
import app from '../app';

describe('GET /api/health', () => {
  it('returns ok true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.ts).toBe('number');
  });
});
