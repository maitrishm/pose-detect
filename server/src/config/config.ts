import { z } from 'zod';

const schema = z.object({
  MONGO_URI: z.string().url('MONGO_URI must be a valid Mongo connection URL'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  SIGNUP_CAP: z.coerce.number().int().positive().default(50),
  RATE_LIMIT: z.coerce.number().int().positive().default(300),
  CLIENT_ORIGIN: z.string().url('CLIENT_ORIGIN must be a valid URL'),
});

export type AppConfig = z.infer<typeof schema>;

let cached: AppConfig | null = null;

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  opts: { forceReload?: boolean } = {}
): AppConfig {
  if (cached && !opts.forceReload) return cached;
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error('\n[CONFIG] Invalid environment variables:\n' + issues + '\n');
    if (env.NODE_ENV === 'test') {
      throw new Error('Invalid config: ' + issues);
    }
    // Fail fast for serverless / production
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
  cached = parsed.data;
  return cached;
}

export function getConfig(): AppConfig {
  return loadConfig();
}

export function resetConfigCache() {
  cached = null;
}
