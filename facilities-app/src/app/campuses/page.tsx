import SiteHeader from '@/components/layout/SiteHeader';
import CampusExplorer from '@/components/admin/campuses/CampusExplorer';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CampusesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const campuses = await db.campus.findMany({
    include: {
      buildings: {
        include: {
          rooms: {
            include: {
              building: { include: { campus: true } },
              roomTags: { include: { tag: true } },
              assets: true,
            },
            orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
          },
        },
        orderBy: { buildingCode: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  const normalizedCampuses = campuses.map((campus) => ({
    ...campus,
    buildings: campus.buildings.map((building) => ({
      ...building,
      rooms: building.rooms.map((room) => ({
        ...room,
        tags: room.roomTags.map((roomTag) => roomTag.tag),
      })),
    })),
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full">
          <CampusExplorer
            campuses={normalizedCampuses}
            initialCampusId={params.campusId}
            initialBuildingId={params.buildingId}
            initialRoomId={params.roomId}
            initialView={(params.view as 'campus' | 'indoor' | 'directory' | undefined) ?? 'campus'}
          />
        </div>
      </main>
    </>
  );
}
