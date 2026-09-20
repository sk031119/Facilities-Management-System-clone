import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, badRequest, serverError } from '@/lib/api-helpers';
import { CreateBuildingSchema } from '@/lib/validations/building.schema';

export async function GET(request: NextRequest) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campusId') ?? undefined;

    const buildings = await db.building.findMany({
      where: campusId ? { campusId } : undefined,
      include: { campus: true },
      orderBy: { buildingCode: 'asc' },
    });
    return Response.json({ data: buildings });
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const body: unknown = await request.json();
    const parsed = CreateBuildingSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }
    const building = await db.building.create({
      data: parsed.data,
      include: { campus: true },
    });
    return Response.json({ data: building, message: 'Building created' }, { status: 201 });
  } catch {
    return serverError();
  }
}
