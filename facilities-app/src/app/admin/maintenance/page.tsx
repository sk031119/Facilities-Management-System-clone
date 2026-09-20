import MaintenanceDataTable from '@/components/admin/maintenance/MaintenanceDataTable';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [logs, rooms] = await Promise.all([
    db.maintenanceLog.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        room: { include: { building: { include: { campus: true } } } },
        createdBy: { select: { name: true } },
      },
    }),
    db.room.findMany({
      include: { building: { include: { campus: true } } },
      orderBy: [{ building: { buildingCode: 'asc' } }, { roomNumber: 'asc' }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <MaintenanceDataTable
        logs={logs as Parameters<typeof MaintenanceDataTable>[0]['logs']}
        rooms={rooms as Parameters<typeof MaintenanceDataTable>[0]['rooms']}
        initialStatus={typeof params.status === 'string' ? params.status : undefined}
        initialPriority={typeof params.priority === 'string' ? params.priority : undefined}
        initialQuery={typeof params.q === 'string' ? params.q : undefined}
      />
    </div>
  );
}
