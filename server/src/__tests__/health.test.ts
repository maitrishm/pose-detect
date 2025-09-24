import request from 'supertest';

import app from '../app';

describe('GET /api/health', () => {
  it('returns ok true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.ts).toBe('number');
  });
});
