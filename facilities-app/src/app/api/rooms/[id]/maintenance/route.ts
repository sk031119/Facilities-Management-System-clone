import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { CreateMaintenanceLogSchema } from '@/lib/validations/maintenance.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(request, 'ADMIN', 'STAFF');
  if (error) return error;

  try {
    const { id } = await params;
    const room = await db.room.findUnique({ where: { id }, select: { id: true } });
    if (!room) return notFound('Room not found');

    const logs = await db.maintenanceLog.findMany({
      where: { roomId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    return Response.json({ data: logs });
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
    const room = await db.room.findUnique({ where: { id }, select: { id: true } });
    if (!room) return notFound('Room not found');

    const body: unknown = await request.json();
    const parsed = CreateMaintenanceLogSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const userId = session!.user.id;

    // Create log and set room to MAINTENANCE in a transaction
    const [log] = await db.$transaction([
      db.maintenanceLog.create({
        data: {
          roomId: id,
          createdById: userId,
          title: parsed.data.title,
          description: parsed.data.description,
          priority: parsed.data.priority,
          status: 'OPEN',
          isActive: true,
          estimatedCompletion: parsed.data.estimatedCompletion
            ? new Date(parsed.data.estimatedCompletion)
            : null,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      db.room.update({ where: { id }, data: { currentStatus: 'MAINTENANCE' } }),
      db.roomStatusHistory.create({ data: { roomId: id, status: 'MAINTENANCE', changedBy: userId } }),
    ]);

    return Response.json({ data: log, message: 'Maintenance log created' }, { status: 201 });
  } catch {
    return serverError();
  }
}
