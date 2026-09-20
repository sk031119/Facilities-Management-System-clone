import { z } from 'zod';

export const MaintenancePrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export const MaintenanceStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']);

export const CreateMaintenanceLogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  description: z.string().min(1, 'Description is required').max(1000),
  priority: MaintenancePrioritySchema.optional().default('MEDIUM'),
  estimatedCompletion: z.string().datetime({ offset: true }).optional(),
});

export const UpdateMaintenanceLogSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().min(1).max(1000).optional(),
  priority: MaintenancePrioritySchema.optional(),
  status: MaintenanceStatusSchema.optional(),
  estimatedCompletion: z.string().datetime({ offset: true }).optional(),
  isActive: z.boolean().optional(),
  resolutionNotes: z.string().max(1000).optional(),
});

export type CreateMaintenanceLogData = z.infer<typeof CreateMaintenanceLogSchema>;
export type UpdateMaintenanceLogData = z.infer<typeof UpdateMaintenanceLogSchema>;
