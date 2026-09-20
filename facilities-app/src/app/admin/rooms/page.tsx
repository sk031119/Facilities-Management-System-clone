import { db } from '@/lib/db';
import RoomsDataTable from '@/components/admin/rooms/RoomsDataTable';
import { buildRoomWhere, serializeRooms } from '@/lib/facilities';
import type { RoomStatus } from '@/types';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function AdminRoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : undefined;
  const campusId = typeof params.campusId === 'string' ? params.campusId : undefined;
  const status = typeof params.status === 'string' ? (params.status as RoomStatus) : undefined;
  const tagId = typeof params.tagId === 'string' ? params.tagId : undefined;
  const pageParam = typeof params.page === 'string' ? Number.parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  let buildingIds: string[] | undefined;
  if (campusId) {
    const campusBuildings = await db.building.findMany({
      where: { campusId },
      select: { id: true },
    });
    buildingIds = campusBuildings.map((building) => building.id);
  }

  const where = buildRoomWhere({
    buildingIds,
    status,
    q,
    tagId,
  });

  const [total, buildings, tags] = await Promise.all([
    db.room.count({ where }),
    db.building.findMany({ include: { campus: true }, orderBy: { buildingCode: 'asc' } }),
    db.tag.findMany({ orderBy: { tagName: 'asc' } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const rooms = await db.room.findMany({
    where,
    include: {
      building: { include: { campus: true } },
      roomTags: { include: { tag: true } },
      assets: true,
    },
    orderBy: { roomNumber: 'asc' },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const roomsWithTags = serializeRooms(rooms) as Parameters<typeof RoomsDataTable>[0]['initialRooms'];

  return (
    <div className="space-y-6">
      <RoomsDataTable
        initialRooms={roomsWithTags}
        buildings={buildings}
        tags={tags}
        page={currentPage}
        total={total}
        totalPages={totalPages}
        title="Room directory"
        initialFilters={{
          q,
          campusId,
          status,
          tagId,
        }}
      />
    </div>
  );
}
