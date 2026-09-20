import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, badRequest, notFound, serverError } from '@/lib/api-helpers';
import { UpdateTagSchema } from '@/lib/validations/tag.schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const { id } = await params;
    const tag = await db.tag.findUnique({ where: { id } });
    if (!tag) return notFound('Tag not found');
    return Response.json({ data: tag });
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
    const existing = await db.tag.findUnique({ where: { id } });
    if (!existing) return notFound('Tag not found');

    const body: unknown = await request.json();
    const parsed = UpdateTagSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const tag = await db.tag.update({ where: { id }, data: parsed.data });
    return Response.json({ data: tag });
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
    const existing = await db.tag.findUnique({ where: { id } });
    if (!existing) return notFound('Tag not found');

    await db.tag.delete({ where: { id } });
    return Response.json({ message: 'Tag deleted' });
  } catch {
    return serverError();
  }
}
