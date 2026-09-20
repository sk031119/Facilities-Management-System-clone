import type { SchedulerTimetable } from '@/types';

const BASE_URL = process.env.SCHEDULER_API_BASE_URL ?? '';
const TIMEOUT_MS = parseInt(process.env.SCHEDULER_API_TIMEOUT_MS ?? '3000', 10);

function fallbackTimetable(roomId: string): SchedulerTimetable {
  return {
    roomId,
    slots: [],
    isFallback: true,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchRoomTimetable(roomId: string): Promise<SchedulerTimetable> {
  if (!BASE_URL) return fallbackTimetable(roomId);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${BASE_URL}/rooms/${roomId}/timetable`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timer);

    if (!response.ok) return fallbackTimetable(roomId);

    const data = (await response.json()) as SchedulerTimetable;
    return { ...data, isFallback: false, fetchedAt: new Date().toISOString() };
  } catch {
    return fallbackTimetable(roomId);
  }
}
