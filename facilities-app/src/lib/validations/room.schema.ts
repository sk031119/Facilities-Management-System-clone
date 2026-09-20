import { z } from 'zod';

export const RoomStatusSchema = z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']);
export const RoomTypeSchema = z.enum(['CLASSROOM', 'LAB', 'LECTURE_HALL', 'OFFICE', 'COMMON_AREA', 'GYM', 'OTHER']);

export const CreateRoomSchema = z.object({
  buildingId: z.string().min(1, 'Building ID is required'),
  roomNumber: z.string().min(1, 'Room number is required').max(20),
  floor: z.number().int().min(0).max(99),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(2000),
  roomType: RoomTypeSchema.optional().default('CLASSROOM'),
  description: z.string().max(500).optional(),
  currentStatus: RoomStatusSchema.optional().default('AVAILABLE'),
  tagIds: z.array(z.string().min(1)).optional().default([]),
});

export const UpdateRoomSchema = z.object({
  roomNumber: z.string().min(1).max(20).optional(),
  floor: z.number().int().min(0).max(99).optional(),
  capacity: z.number().int().min(1).max(2000).optional(),
  roomType: RoomTypeSchema.optional(),
  description: z.string().max(500).optional(),
  currentStatus: RoomStatusSchema.optional(),
  tagIds: z.array(z.string().min(1)).optional(),
});

export const RoomQuerySchema = z.object({
  buildingId: z.string().min(1).optional(),
  campusId: z.string().min(1).optional(),
  tagId: z.string().min(1).optional(),
  status: RoomStatusSchema.optional(),
  roomType: RoomTypeSchema.optional(),
  q: z.string().max(100).optional(),
  minCapacity: z.coerce.number().int().min(1).max(5000).optional(),
  maxCapacity: z.coerce.number().int().min(1).max(5000).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).refine(
  (value) =>
    value.minCapacity === undefined ||
    value.maxCapacity === undefined ||
    value.minCapacity <= value.maxCapacity,
  {
    message: 'Minimum capacity must be less than or equal to maximum capacity',
    path: ['minCapacity'],
  }
);

export type CreateRoomData = z.infer<typeof CreateRoomSchema>;
export type UpdateRoomData = z.infer<typeof UpdateRoomSchema>;
export type RoomQueryData = z.infer<typeof RoomQuerySchema>;
