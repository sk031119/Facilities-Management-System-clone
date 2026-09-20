import OperationsCharts from '@/components/admin/dashboard/OperationsCharts';
import OperationsShowcase from '@/components/admin/dashboard/OperationsShowcase';
import RecentMaintenanceTable from '@/components/admin/dashboard/RecentMaintenanceTable';
import { db } from '@/lib/db';
import type { DashboardStats } from '@/types';

export const dynamic = 'force-dynamic';

async function getStats(): Promise<DashboardStats> {
  const [totalRooms, availableRooms, occupiedRooms, roomsInMaintenance, activeMaintenanceLogs, totalBuildings, totalCampuses] =
    await Promise.all([
      db.room.count(),
      db.room.count({ where: { currentStatus: 'AVAILABLE' } }),
      db.room.count({ where: { currentStatus: 'OCCUPIED' } }),
      db.room.count({ where: { currentStatus: 'MAINTENANCE' } }),
      db.maintenanceLog.count({ where: { isActive: true } }),
      db.building.count(),
      db.campus.count(),
    ]);
  return { totalRooms, availableRooms, occupiedRooms, roomsInMaintenance, activeMaintenanceLogs, totalBuildings, totalCampuses };
}

export default async function AdminDashboardPage() {
  const [stats, recentLogs] = await Promise.all([
    getStats(),
    db.maintenanceLog.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        room: { include: { building: true } },
        createdBy: { select: { name: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-5">
      <OperationsShowcase stats={stats} />
      <OperationsCharts stats={stats} />
      <RecentMaintenanceTable logs={recentLogs as Parameters<typeof RecentMaintenanceTable>[0]['logs']} />
    </div>
  );
}
