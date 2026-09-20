import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, requireRole, badRequest, serverError } from '@/lib/api-helpers';
import { CreateCampusSchema } from '@/lib/validations/campus.schema';

export async function GET(request: NextRequest) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const campuses = await db.campus.findMany({
      orderBy: { name: 'asc' },
    });
    return Response.json({ data: campuses });
  } catch {
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await requireRole(request, 'ADMIN');
  if (error) return error;
  void session;

  try {
    const body: unknown = await request.json();
    const parsed = CreateCampusSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest('Validation failed', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }
    const campus = await db.campus.create({ data: parsed.data });
    return Response.json({ data: campus, message: 'Campus created' }, { status: 201 });
  } catch {
    return serverError();
  }
}
