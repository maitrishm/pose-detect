import { z } from 'zod';

export const aggregateCreateSchema = z.object({
  sessionId: z.string().min(1),
  metrics: z.record(z.any()).default({}),
});

export const aggregateUpdateSchema = z.object({
  metrics: z.record(z.any()).refine((v) => Object.keys(v).length > 0, 'metrics required'),
});

export type AggregateCreateInput = z.infer<typeof aggregateCreateSchema>;
export type AggregateUpdateInput = z.infer<typeof aggregateUpdateSchema>;
