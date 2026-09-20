import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { UpdateCampusSchema } from '@/lib/validations/campus.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const { id } = await params;
    const campus = await db.campus.findUnique({
      where: { id },
      include: { buildings: { orderBy: { buildingCode: 'asc' } } },
    });
    if (!campus) return notFound('Campus not found');
    return Response.json({ data: campus });
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
    const parsed = UpdateCampusSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }
    const campus = await db.campus.update({ where: { id }, data: parsed.data });
    return Response.json({ data: campus });
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
    await db.campus.delete({ where: { id } });
    return Response.json({ message: 'Campus deleted' });
  } catch {
    return serverError();
  }
}
