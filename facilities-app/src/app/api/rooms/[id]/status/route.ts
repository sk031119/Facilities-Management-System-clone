import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, notFound, serverError } from '@/lib/api-helpers';
import { z } from 'zod';

const StatusOverrideSchema = z.object({
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']),
  reason: z.string().max(255).optional(),
});

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
      select: {
        id: true,
        currentStatus: true,
        updatedAt: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!room) return notFound('Room not found');
    return Response.json({ data: room });
  } catch {
    return serverError();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(request, 'ADMIN', 'STAFF');
  if (error) return error;

  try {
    const { id } = await params;
    const existing = await db.room.findUnique({ where: { id }, select: { id: true, currentStatus: true } });
    if (!existing) return notFound('Room not found');

    const body: unknown = await request.json();
    const parsed = StatusOverrideSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status } = parsed.data;

    if (status === existing.currentStatus) {
      return Response.json({ data: existing, message: 'Status unchanged' });
    }

    const [room] = await db.$transaction([
      db.room.update({ where: { id }, data: { currentStatus: status } }),
      db.roomStatusHistory.create({
        data: { roomId: id, status, changedBy: session!.user.id },
      }),
    ]);

    return Response.json({ data: room, message: 'Status updated' });
  } catch {
    return serverError();
  }
}
