import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, badRequest, serverError } from '@/lib/api-helpers';
import { CreateTagSchema } from '@/lib/validations/tag.schema';

export async function GET(request: NextRequest) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const tags = await db.tag.findMany({ orderBy: { tagName: 'asc' } });
    return Response.json({ data: tags });
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  try {
    const body: unknown = await request.json();
    const parsed = CreateTagSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }
    const tag = await db.tag.create({ data: parsed.data });
    return Response.json({ data: tag, message: 'Tag created' }, { status: 201 });
  } catch {
    return serverError();
  }
}
