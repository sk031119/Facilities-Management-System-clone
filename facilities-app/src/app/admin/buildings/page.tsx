import { db } from '@/lib/db';
import BuildingsDataTable from '@/components/admin/buildings/BuildingsDataTable';
import type { CampusWithBuildings } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminBuildingsPage() {
  const campuses = await db.campus.findMany({
    include: {
      buildings: {
        include: { campus: true, _count: { select: { rooms: true } } },
        orderBy: { buildingCode: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <BuildingsDataTable campuses={campuses as CampusWithBuildings[]} />
    </div>
  );
}
