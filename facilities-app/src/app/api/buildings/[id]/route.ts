import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { UpdateBuildingSchema } from '@/lib/validations/building.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const { id } = await params;
    const building = await db.building.findUnique({
      where: { id },
      include: {
        campus: true,
        rooms: { orderBy: { roomNumber: 'asc' } },
      },
    });
    if (!building) return notFound('Building not found');
    return Response.json({ data: building });
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
    const existing = await db.building.findUnique({ where: { id } });
    if (!existing) return notFound('Building not found');

    const body: unknown = await request.json();
    const parsed = UpdateBuildingSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const building = await db.building.update({
      where: { id },
      data: parsed.data,
      include: { campus: true },
    });
    return Response.json({ data: building });
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
    const existing = await db.building.findUnique({
      where: { id },
      include: { _count: { select: { rooms: true } } },
    });
    if (!existing) return notFound('Building not found');

    if (existing._count.rooms > 0) {
      return Response.json(
        { error: 'Cannot delete a building that has rooms. Archive or reassign rooms first.' },
        { status: 409 }
      );
    }

    await db.building.delete({ where: { id } });
    return Response.json({ message: 'Building deleted' });
  } catch {
    return serverError();
  }
}
