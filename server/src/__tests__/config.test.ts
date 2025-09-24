import { loadConfig, resetConfigCache } from '../config/config';

describe('config loader', () => {
  const BASE = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    JWT_SECRET: 'jwt_secret_value_123456',
    SIGNUP_CAP: '50',
    RATE_LIMIT: '300',
    CLIENT_ORIGIN: 'http://localhost:3000',
  } as Record<string, string>;

  it('loads valid config', () => {
    const cfg = loadConfig({ ...BASE });
    expect(cfg.MONGO_URI).toMatch(/^mongodb/);
    expect(cfg.SIGNUP_CAP).toBe(50);
  });

  it('throws error (test env) on invalid config instead of exiting', () => {
    const spyError = jest.spyOn(console, 'error').mockImplementation(() => {});
    resetConfigCache();
    const invalidEnv: NodeJS.ProcessEnv = {
      ...BASE,
      JWT_SECRET: 'short',
      NODE_ENV: 'test',
    };
    expect(() => loadConfig(invalidEnv, { forceReload: true })).toThrow(/Invalid config/);
    spyError.mockRestore();
  });
});
