import { Suspense } from 'react';
import SiteHeader from '@/components/layout/SiteHeader';
import RoomFilters from '@/components/room-browser/RoomFilters';
import RoomGrid from '@/components/room-browser/RoomGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/db';
import { buildRoomWhere, serializeRooms } from '@/lib/facilities';
import type { Room } from '@/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24;

interface RoomBrowserStats {
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  campusCount: number;
  buildingCount: number;
}

interface RoomBrowserData {
  data: Room[];
  total: number;
  page: number;
  totalPages: number;
  stats: RoomBrowserStats;
}

async function resolveBuildingIds(campusId?: string) {
  if (!campusId) return undefined;

  const buildings = await db.building.findMany({
    where: { campusId },
    select: { id: true },
  });

  return buildings.map((building) => building.id);
}

async function getRooms(params: Record<string, string>): Promise<RoomBrowserData> {
  const { campusId, buildingId, tagId, status, roomType, q, minCapacity, maxCapacity } = params;
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const buildingIds = await resolveBuildingIds(campusId);

  if (campusId && (buildingIds?.length ?? 0) === 0) {
    return {
      data: [],
      total: 0,
      page,
      totalPages: 0,
      stats: {
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        campusCount: 0,
        buildingCount: 0,
      },
    };
  }

  const where = buildRoomWhere({
    buildingId,
    buildingIds,
    status: status as Room['currentStatus'],
    roomType: roomType as Room['roomType'],
    q,
    tagId,
    minCapacity: minCapacity ? Number(minCapacity) : undefined,
    maxCapacity: maxCapacity ? Number(maxCapacity) : undefined,
  });

  const [rooms, total, statusGroups, locationRows] = await Promise.all([
    db.room.findMany({
      where,
      include: {
        building: { include: { campus: true } },
        roomTags: { include: { tag: true } },
        assets: true,
      },
      orderBy: { roomNumber: 'asc' },
      skip,
      take: PAGE_SIZE,
    }),
    db.room.count({ where }),
    db.room.groupBy({
      by: ['currentStatus'],
      where,
      _count: { _all: true },
    }),
    db.room.findMany({
      where,
      select: {
        buildingId: true,
        building: {
          select: {
            campusId: true,
          },
        },
      },
    }),
  ]);

  const statusCounts = statusGroups.reduce<Record<Room['currentStatus'], number>>(
    (acc, group) => {
      acc[group.currentStatus as Room['currentStatus']] = group._count._all;
      return acc;
    },
    {
      AVAILABLE: 0,
      OCCUPIED: 0,
      MAINTENANCE: 0,
    }
  );

  const stats: RoomBrowserStats = {
    availableRooms: statusCounts.AVAILABLE,
    occupiedRooms: statusCounts.OCCUPIED,
    maintenanceRooms: statusCounts.MAINTENANCE,
    buildingCount: new Set(locationRows.map((row) => row.buildingId)).size,
    campusCount: new Set(locationRows.map((row) => row.building?.campusId).filter(Boolean)).size,
  };

  return {
    data: serializeRooms(rooms) as unknown as Room[],
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
    stats,
  };
}

export default async function RoomBrowserPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  const [{ data: rooms, total, page, totalPages, stats }, campuses, buildings, tags] = await Promise.all([
    getRooms(params),
    db.campus.findMany({ orderBy: { name: 'asc' } }),
    db.building.findMany({ include: { campus: true }, orderBy: { buildingCode: 'asc' } }),
    db.tag.findMany({ orderBy: { tagName: 'asc' } }),
  ]);

  const hasActiveFilters = Object.keys(params).length > 0;
  const availableRooms = stats.availableRooms;
  const occupiedRooms = stats.occupiedRooms;
  const maintenanceRooms = stats.maintenanceRooms;
  const visibleTotal = Math.max(total, 1);
  const availablePercent = Math.round((availableRooms / visibleTotal) * 100);
  const occupiedPercent = Math.round((occupiedRooms / visibleTotal) * 100);
  const maintenancePercent = Math.round((maintenanceRooms / visibleTotal) * 100);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full space-y-6">
          <section className="rounded-[2rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--fass-text)] sm:text-4xl" style={{ fontFamily: 'var(--font-heading)' }}>
                  Room finder
                </h1>
                <Badge variant="outline">{hasActiveFilters ? 'Filtered' : 'All rooms'}</Badge>
              </div>

              <div className="grid auto-rows-fr gap-4 xl:grid-cols-12 xl:items-stretch">
                <div className="rounded-[1.5rem] border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-5 py-4 xl:col-span-6">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium text-[var(--fass-text)]">Status mix</p>
                    <span className="text-[var(--fass-text-muted)]">
                      {hasActiveFilters ? `${total} matching` : `${total} total`}
                    </span>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--fass-bg-white)]">
                    <div className="flex h-full">
                      <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${(availableRooms / visibleTotal) * 100}%` }} />
                      <div className="bg-rose-500 transition-all duration-700" style={{ width: `${(occupiedRooms / visibleTotal) * 100}%` }} />
                      <div className="bg-[var(--fass-yellow)] transition-all duration-700" style={{ width: `${(maintenanceRooms / visibleTotal) * 100}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="font-semibold text-emerald-600">{availableRooms}</p>
                      <p className="text-[var(--fass-text-muted)]">{availablePercent}% available</p>
                    </div>
                    <div>
                      <p className="font-semibold text-rose-500">{occupiedRooms}</p>
                      <p className="text-[var(--fass-text-muted)]">{occupiedPercent}% occupied</p>
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--fass-yellow)]">{maintenanceRooms}</p>
                      <p className="text-[var(--fass-text-muted)]">{maintenancePercent}% maintenance</p>
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col justify-between rounded-[1.2rem] border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-4 xl:col-span-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Campuses</p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--fass-text)]">{stats.campusCount || campuses.length}</p>
                </div>
                <div className="flex h-full flex-col justify-between rounded-[1.2rem] border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-4 xl:col-span-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Buildings</p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--fass-text)]">{stats.buildingCount || buildings.length}</p>
                </div>
                <div className="flex h-full flex-col justify-between rounded-[1.2rem] border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-4 xl:col-span-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Need service</p>
                  <p className="mt-3 text-2xl font-semibold text-[var(--fass-text)]">{maintenanceRooms}</p>
                </div>
              </div>
            </div>
          </section>

          <Suspense fallback={<Skeleton className="h-36 w-full rounded-[2rem]" />}>
            <RoomFilters campuses={campuses} buildings={buildings} tags={tags} />
          </Suspense>

          <RoomGrid rooms={rooms} total={total} page={page} totalPages={totalPages} />
        </div>
      </main>
    </>
  );
}
