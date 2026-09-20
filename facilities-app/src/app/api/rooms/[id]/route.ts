import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, notFound, badRequest, serverError } from '@/lib/api-helpers';
import { serializeRoom } from '@/lib/facilities';
import { UpdateRoomSchema } from '@/lib/validations/room.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const { id } = await params;
    const room = await db.room.findUnique({
      where: { id },
      include: {
        building: { include: { campus: true } },
        roomTags: { include: { tag: true } },
        assets: { orderBy: { itemName: 'asc' } },
        maintenanceLogs: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true, email: true, role: true } } },
        },
      },
    });
    if (!room) return notFound('Room not found');

    return Response.json({ data: serializeRoom(room) });
  } catch {
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = UpdateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { tagIds, currentStatus, ...rest } = parsed.data;

    // Get current room to compare status
    const existing = await db.room.findUnique({ where: { id }, select: { currentStatus: true } });
    if (!existing) return notFound('Room not found');

    const room = await db.room.update({
      where: { id },
      data: {
        ...rest,
        ...(currentStatus ? { currentStatus } : {}),
        ...(tagIds !== undefined
          ? {
              roomTags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: {
        building: { include: { campus: true } },
        roomTags: { include: { tag: true } },
        assets: true,
      },
    });

    // Log status change if it changed
    if (currentStatus && currentStatus !== existing.currentStatus) {
      await db.roomStatusHistory.create({
        data: { roomId: id, status: currentStatus },
      });
    }

    return Response.json({ data: serializeRoom(room) });
  } catch {
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const { id } = await params;
    await db.room.delete({ where: { id } });
    return Response.json({ message: 'Room deleted' });
  } catch {
    return serverError();
  }
}
