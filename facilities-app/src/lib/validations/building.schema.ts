import { z } from 'zod';

export const CreateBuildingSchema = z.object({
  campusId: z.string().min(1, 'Campus ID is required'),
  name: z.string().min(1, 'Name is required').max(100),
  buildingCode: z
    .string()
    .min(1, 'Building code is required')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase letters, numbers, or hyphens'),
  mapLatitude: z.number().min(-90).max(90).nullable().optional(),
  mapLongitude: z.number().min(-180).max(180).nullable().optional(),
  mapLabel: z.string().max(120).nullable().optional(),
});

export const UpdateBuildingSchema = CreateBuildingSchema.partial();

export type CreateBuildingData = z.infer<typeof CreateBuildingSchema>;
export type UpdateBuildingData = z.infer<typeof UpdateBuildingSchema>;
