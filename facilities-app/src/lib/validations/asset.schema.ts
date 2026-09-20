import { z } from 'zod';

export const CreateAssetSchema = z.object({
  itemName: z.string().min(1, 'Item name is required').max(100),
  quantity: z.number().int().min(1).optional().default(1),
  isFunctional: z.boolean().optional().default(true),
});

export const UpdateAssetSchema = CreateAssetSchema.partial();

export type CreateAssetData = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetData = z.infer<typeof UpdateAssetSchema>;
