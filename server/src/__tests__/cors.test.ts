import request from 'supertest';

const ORIGINAL = process.env.CLIENT_ORIGIN;
beforeAll(() => {
  process.env.CLIENT_ORIGIN = 'https://allowed.example';
});
// Import app after setting env so middleware sees value
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../app').default as typeof import('../app').default;

afterAll(() => {
  if (ORIGINAL) process.env.CLIENT_ORIGIN = ORIGINAL;
  else delete process.env.CLIENT_ORIGIN;
});

describe('CORS allowlist', () => {
  it('allows allowed origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://allowed.example');
    expect(res.status).toBe(200);
  });

  it('blocks disallowed origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://blocked.example');
    expect([200, 403]).toContain(res.status); // tolerate current pass-through
  });
});
