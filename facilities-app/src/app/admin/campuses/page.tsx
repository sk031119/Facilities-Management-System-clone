import BuildingTree from '@/components/admin/buildings/BuildingTree';
import { db } from '@/lib/db';
import type { CampusWithBuildings } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminCampusesPage() {
  const campuses = await db.campus.findMany({
    include: {
      buildings: {
        include: {
          campus: true,
          rooms: {
            include: {
              building: { include: { campus: true } },
              roomTags: { include: { tag: true } },
              assets: true,
            },
            orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
          },
          _count: { select: { rooms: true } },
        },
        orderBy: { buildingCode: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <BuildingTree campuses={campuses as CampusWithBuildings[]} />
  );
}
