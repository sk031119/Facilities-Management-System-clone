import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { CreateAssetSchema } from '@/lib/validations/asset.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const { id } = await params;
    const room = await db.room.findUnique({ where: { id }, select: { id: true } });
    if (!room) return notFound('Room not found');

    const assets = await db.asset.findMany({
      where: { roomId: id },
      orderBy: { itemName: 'asc' },
    });
    return Response.json({ data: assets });
  } catch {
    return serverError();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(request, 'ADMIN', 'STAFF');
  if (error) return error;

  try {
    const { id } = await params;
    const room = await db.room.findUnique({ where: { id }, select: { id: true } });
    if (!room) return notFound('Room not found');

    const body: unknown = await request.json();
    const parsed = CreateAssetSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const asset = await db.asset.create({
      data: { ...parsed.data, roomId: id },
    });
    return Response.json({ data: asset, message: 'Asset added' }, { status: 201 });
  } catch {
    return serverError();
  }
}
