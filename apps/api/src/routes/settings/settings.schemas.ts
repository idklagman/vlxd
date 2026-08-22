import { z } from 'zod';

export const updateSettingSchema = z.object({
  value: z.string(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
