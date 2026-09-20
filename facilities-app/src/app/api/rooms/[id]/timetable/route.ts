import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireApiAccess, notFound, serverError } from '@/lib/api-helpers';
import { fetchRoomTimetable } from '@/lib/scheduler';

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

    const timetable = await fetchRoomTimetable(id);
    return Response.json({ data: timetable });
  } catch {
    return serverError();
  }
}
