import { z } from 'zod';

export const CreateTagSchema = z.object({
  tagName: z
    .string()
    .min(1, 'Tag name is required')
    .max(50)
    .regex(/^#?[\w]+$/, 'Tag name can only contain letters, numbers, and underscores'),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color')
    .optional()
    .default('#007ACC'),
});

export const UpdateTagSchema = CreateTagSchema.partial();

export type CreateTagData = z.infer<typeof CreateTagSchema>;
export type UpdateTagData = z.infer<typeof UpdateTagSchema>;
