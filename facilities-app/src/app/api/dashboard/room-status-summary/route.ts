import { requireApiAccess, serverError } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import type { NextRequest } from 'next/server';

interface CampusSummaryInput {
  id: string;
  name: string;
  buildings: {
    rooms: { currentStatus: string }[];
  }[];
}

interface SummaryItem {
  campusId: string;
  campusName: string;
  available: number;
  occupied: number;
  maintenance: number;
  total: number;
}

export async function GET(request: NextRequest) {
  const { error } = await requireApiAccess(request);
  if (error) return error;

  try {
    const campuses = await db.campus.findMany({
      include: {
        buildings: {
          include: {
            _count: { select: { rooms: true } },
            rooms: { select: { currentStatus: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const summary = (campuses as CampusSummaryInput[]).map((campus): SummaryItem => {
      const allRooms = campus.buildings.flatMap((b: { rooms: { currentStatus: string }[] }) => b.rooms);
      return {
        campusId: campus.id,
        campusName: campus.name,
        available: allRooms.filter((r: { currentStatus: string }) => r.currentStatus === 'AVAILABLE').length,
        occupied: allRooms.filter((r: { currentStatus: string }) => r.currentStatus === 'OCCUPIED').length,
        maintenance: allRooms.filter((r: { currentStatus: string }) => r.currentStatus === 'MAINTENANCE').length,
        total: allRooms.length,
      };
    });

    const totals = {
      available: summary.reduce((acc: number, c: SummaryItem) => acc + c.available, 0),
      occupied: summary.reduce((acc: number, c: SummaryItem) => acc + c.occupied, 0),
      maintenance: summary.reduce((acc: number, c: SummaryItem) => acc + c.maintenance, 0),
      total: summary.reduce((acc: number, c: SummaryItem) => acc + c.total, 0),
    };

    return Response.json({ data: { byCampus: summary, totals } });
  } catch {
    return serverError();
  }
}
