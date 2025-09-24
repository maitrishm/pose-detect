import { z } from 'zod';

export const settingsSchema = z.object({
  engine: z.enum(['mediapipe', 'movenet']).optional(),
  voice: z.enum(['basic', 'technical', 'motivational', 'silent']).optional(),
  theme: z.enum(['light', 'dark']).optional(),
  uiScale: z.number().min(0.75).max(1.5).optional(),
  units: z.enum(['metric', 'imperial']).optional(),
});

export type UserSettingsInput = z.infer<typeof settingsSchema>;
