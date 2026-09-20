import { NextRequest } from 'next/server';
import { z } from 'zod';
import { badRequest, notFound, requireRole, serverError } from '@/lib/api-helpers';
import { setUserRole } from '@/lib/auth-admin';

const roleSchema = z.object({
  role: z.enum(['ADMIN', 'STAFF', 'PUBLIC']),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(request, 'ADMIN');
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = roleSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest('Validation failed', parsed.error.flatten().fieldErrors);
  }

  try {
    const { id } = await context.params;

    if (session?.user.id === id && parsed.data.role !== 'ADMIN') {
      return badRequest('You cannot remove your own admin access.');
    }

    const user = await setUserRole(id, parsed.data.role);

    return Response.json({
      data: user,
      message: `Updated role for ${user.email}.`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('No record')) {
      return notFound('User not found');
    }

    return serverError('Unable to update user role');
  }
}
