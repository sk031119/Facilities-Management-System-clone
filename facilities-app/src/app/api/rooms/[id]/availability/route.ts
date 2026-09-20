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
    const room = await db.room.findUnique({
      where: { id },
      select: { id: true, capacity: true, currentStatus: true, maintenanceLogs: { where: { isActive: true } } },
    });
    if (!room) return notFound('Room not found');

    if (room.currentStatus === 'MAINTENANCE') {
      return Response.json({
        data: {
          roomId: id,
          available: false,
          reason: 'MAINTENANCE',
          currentSlot: null,
          isFallback: false,
          nextAvailableAt: null,
        },
      });
    }

    const timetable = await fetchRoomTimetable(id);
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = dayNames[now.getDay()];
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const currentSlot = timetable.slots.find((slot) => {
      if (slot.dayOfWeek !== todayName) return false;
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      return nowMinutes >= start && nowMinutes < end;
    });

    return Response.json({
      data: {
        roomId: id,
        available: !currentSlot,
        reason: currentSlot ? 'OCCUPIED' : 'AVAILABLE',
        currentSlot: currentSlot ?? null,
        isFallback: timetable.isFallback,
      },
    });
  } catch {
    return serverError();
  }
}
