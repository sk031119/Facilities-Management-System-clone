import { z } from 'zod';

export const CreateCampusSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().min(1, 'Address is required').max(255),
  timezone: z.string().max(50).optional().default('America/Toronto'),
  mapLatitude: z.number().min(-90).max(90).nullable().optional(),
  mapLongitude: z.number().min(-180).max(180).nullable().optional(),
  mapZoom: z.number().int().min(13).max(19).nullable().optional(),
  mapLocationLabel: z.string().max(120).nullable().optional(),
});

export const UpdateCampusSchema = CreateCampusSchema.partial();

export type CreateCampusData = z.infer<typeof CreateCampusSchema>;
export type UpdateCampusData = z.infer<typeof UpdateCampusSchema>;
