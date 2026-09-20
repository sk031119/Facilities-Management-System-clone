import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { UpdateMaintenanceLogSchema } from '@/lib/validations/maintenance.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { error } = await requireRole(request, 'ADMIN', 'STAFF');
  if (error) return error;

  try {
    const { id, logId } = await params;
    const log = await db.maintenanceLog.findFirst({
      where: { id: logId, roomId: id },
      include: { createdBy: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (!log) return notFound('Maintenance log not found');
    return Response.json({ data: log });
  } catch {
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { session, error } = await requireRole(request, 'ADMIN', 'STAFF');
  if (error) return error;

  try {
    const { id, logId } = await params;
    const existing = await db.maintenanceLog.findFirst({ where: { id: logId, roomId: id } });
    if (!existing) return notFound('Maintenance log not found');

    const body: unknown = await request.json();
    const parsed = UpdateMaintenanceLogSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { isActive, estimatedCompletion, status, resolutionNotes, ...rest } = parsed.data;

    type TransactionContext = Parameters<Parameters<typeof db.$transaction>[0]>[0];
    const log = await db.$transaction(async (tx: TransactionContext) => {
      const nextStatus =
        status ?? (isActive === false ? 'RESOLVED' : isActive === true ? 'OPEN' : existing.status);
      const nextIsActive = nextStatus !== 'RESOLVED';

      const updated = await tx.maintenanceLog.update({
        where: { id: logId },
        data: {
          ...rest,
          status: nextStatus,
          isActive: nextIsActive,
          ...(estimatedCompletion !== undefined
            ? { estimatedCompletion: estimatedCompletion ? new Date(estimatedCompletion) : null }
            : {}),
          ...(resolutionNotes !== undefined ? { resolutionNotes } : {}),
          ...(nextStatus === 'RESOLVED' && existing.status !== 'RESOLVED'
            ? { resolvedAt: new Date() }
            : {}),
          ...(nextStatus !== 'RESOLVED' && existing.status === 'RESOLVED'
            ? { resolvedAt: null }
            : {}),
        },
        include: { createdBy: { select: { id: true, name: true, email: true, role: true } } },
      });

      // When closing a maintenance log, restore the room to AVAILABLE
      if (nextStatus === 'RESOLVED' && existing.status !== 'RESOLVED') {
        const otherActiveLogs = await tx.maintenanceLog.count({
          where: { roomId: id, isActive: true, id: { not: logId } },
        });
        if (otherActiveLogs === 0) {
          await tx.room.update({ where: { id }, data: { currentStatus: 'AVAILABLE' } });
          await tx.roomStatusHistory.create({
            data: { roomId: id, status: 'AVAILABLE', changedBy: session!.user.id },
          });
        }
      }

      if (nextStatus === 'IN_PROGRESS' && existing.status === 'RESOLVED') {
        await tx.room.update({ where: { id }, data: { currentStatus: 'MAINTENANCE' } });
        await tx.roomStatusHistory.create({
          data: { roomId: id, status: 'MAINTENANCE', changedBy: session!.user.id },
        });
      }

      return updated;
    });

    return Response.json({ data: log });
  } catch {
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const { id, logId } = await params;
    const existing = await db.maintenanceLog.findFirst({ where: { id: logId, roomId: id } });
    if (!existing) return notFound('Maintenance log not found');

    await db.maintenanceLog.delete({ where: { id: logId } });
    return Response.json({ message: 'Maintenance log deleted' });
  } catch {
    return serverError();
  }
}
