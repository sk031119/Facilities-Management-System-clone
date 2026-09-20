import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { UpdateAssetSchema } from '@/lib/validations/asset.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const { id, assetId } = await params;
    const asset = await db.asset.findFirst({ where: { id: assetId, roomId: id } });
    if (!asset) return notFound('Asset not found');
    return Response.json({ data: asset });
  } catch {
    return serverError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const { error } = await requireRole(request, 'ADMIN', 'STAFF');
  if (error) return error;

  try {
    const { id, assetId } = await params;
    const existing = await db.asset.findFirst({ where: { id: assetId, roomId: id } });
    if (!existing) return notFound('Asset not found');

    const body: unknown = await request.json();
    const parsed = UpdateAssetSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const asset = await db.asset.update({ where: { id: assetId }, data: parsed.data });
    return Response.json({ data: asset });
  } catch {
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const { id, assetId } = await params;
    const existing = await db.asset.findFirst({ where: { id: assetId, roomId: id } });
    if (!existing) return notFound('Asset not found');

    await db.asset.delete({ where: { id: assetId } });
    return Response.json({ message: 'Asset deleted' });
  } catch {
    return serverError();
  }
}
