import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, badRequest, serverError } from '@/lib/api-helpers';
import { buildRoomWhere, serializeRooms } from '@/lib/facilities';
import { CreateRoomSchema, RoomQuerySchema } from '@/lib/validations/room.schema';

export async function GET(request: NextRequest) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const query = RoomQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!query.success) {
      return badRequest('Invalid query parameters', query.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { buildingId, campusId, tagId, status, roomType, q, minCapacity, maxCapacity, page, limit } =
      query.data;
    const skip = (page - 1) * limit;

    // Resolve campusId → buildingIds
    let buildingIds: string[] | undefined;
    if (campusId) {
      const buildings = await db.building.findMany({
        where: { campusId },
        select: { id: true },
      });
      buildingIds = buildings.map((b: { id: string }) => b.id);
      if ((buildingIds ?? []).length === 0) {
        return Response.json({ data: [], total: 0, page, limit, totalPages: 0 });
      }
    }

    const where = buildRoomWhere({
      buildingId,
      buildingIds,
      status,
      roomType,
      q,
      tagId,
      minCapacity,
      maxCapacity,
    });

    const [rooms, total] = await Promise.all([
      db.room.findMany({
        where,
        include: {
          building: { include: { campus: true } },
          roomTags: { include: { tag: true } },
          assets: true,
        },
        orderBy: { roomNumber: 'asc' },
        skip,
        take: limit,
      }),
      db.room.count({ where }),
    ]);

    // Flatten tags for convenience
    const data = serializeRooms(rooms);

    return Response.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const body: unknown = await request.json();
    const parsed = CreateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { tagIds, ...roomData } = parsed.data;

    const room = await db.room.create({
      data: {
        ...roomData,
        roomTags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: {
        building: { include: { campus: true } },
        roomTags: { include: { tag: true } },
        assets: true,
      },
    });

    // Log initial status
    await db.roomStatusHistory.create({
      data: { roomId: room.id, status: room.currentStatus },
    });

    return Response.json({ data: serializeRooms([room])[0], message: 'Room created' }, { status: 201 });
  } catch {
    return serverError();
  }
}
