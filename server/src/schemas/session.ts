import { z } from 'zod';

export const sessionCreateSchema = z.object({
  mode: z.enum(['partner', 'solo']),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
  title: z.string().min(1).max(120).optional(),
  notes: z.string().max(2000).optional(),
  config: z.record(z.any()).optional(),
});

export const sessionUpdateSchema = z
  .object({
    title: z.string().min(1).max(120).optional(),
    notes: z.string().max(2000).optional(),
    endedAt: z.coerce.date().optional(),
    config: z.record(z.any()).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'No fields to update' });

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
