import { z } from 'zod';

export const passwordChangeSchema = z.object({
  newPassword: z.string().min(8).max(72),
});

export function isValidNewPassword(value: unknown) {
  return passwordChangeSchema.safeParse({ newPassword: value }).success;
}
