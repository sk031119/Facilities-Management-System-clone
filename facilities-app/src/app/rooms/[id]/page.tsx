import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { fetchRoomTimetable } from '@/lib/scheduler';
import { ChevronRight, Users, Layers, Building2, MapPin, Wrench } from 'lucide-react';
import SiteHeader from '@/components/layout/SiteHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import RoomStatusBadge from '@/components/room-browser/RoomStatusBadge';
import TimetableView from '@/components/room-browser/TimetableView';
import type { RoomStatus, RoomType, Tag, Asset, MaintenanceLog } from '@/types';
import { ROOM_TYPE_LABELS } from '@/lib/facilities';

export const dynamic = 'force-dynamic';

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [room, timetable] = await Promise.all([
    db.room.findUnique({
      where: { id },
      include: {
        building: { include: { campus: true } },
        roomTags: { include: { tag: true } },
        assets: { orderBy: { itemName: 'asc' } },
        maintenanceLogs: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { createdBy: { select: { name: true } } },
        },
        statusHistory: { orderBy: { changedAt: 'desc' }, take: 5 },
      },
    }),
    fetchRoomTimetable(id),
  ]);

  if (!room) notFound();

  const tags = room.roomTags.map((rt: { tag: Tag }) => rt.tag);
  const activeMaintenanceLogs = room.maintenanceLogs.filter((l: { isActive: boolean }) => l.isActive);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[var(--fass-text-muted)]">
          <Link href="/" className="hover:text-[var(--fass-blue)] transition-colors">Rooms</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[var(--fass-text)] font-medium">{room.roomNumber}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-[var(--fass-text)] fass-heading" style={{ fontFamily: 'var(--font-heading)' }}>
              Room {room.roomNumber}
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-[var(--fass-text-muted)]">
              <Building2 className="w-3.5 h-3.5" />
              <span>{room.building?.buildingCode} — {room.building?.name}</span>
              <span className="text-[var(--fass-border)]">|</span>
              <MapPin className="w-3.5 h-3.5" />
              <span>{room.building?.campus?.name}</span>
            </div>
          </div>
          <RoomStatusBadge status={room.currentStatus as RoomStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Room info + assets */}
          <div className="lg:col-span-1 space-y-6">
            {/* Room Details Card */}
            <Card className="border-[var(--fass-border)] bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[var(--fass-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Room Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--fass-text-muted)] flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Floor
                  </span>
                  <span className="text-sm font-medium">{room.floor}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--fass-text-muted)] flex items-center gap-2">
                    <Users className="w-4 h-4" /> Capacity
                  </span>
                  <span className="text-sm font-medium">{room.capacity} seats</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--fass-text-muted)]">Type</span>
                  <span className="text-sm font-medium">{ROOM_TYPE_LABELS[room.roomType as RoomType]}</span>
                </div>
                {room.description && (
                  <>
                    <Separator />
                    <p className="text-sm text-[var(--fass-text-muted)]">{room.description}</p>
                  </>
                )}
                {tags.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-1.5">
                      {(tags as Tag[]).map((tag: Tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: `${tag.colorCode}18`, color: tag.colorCode, borderColor: `${tag.colorCode}33` }}
                        >
                          {tag.tagName}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active Maintenance */}
            {activeMaintenanceLogs.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-amber-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <Wrench className="w-4 h-4" /> Active Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(activeMaintenanceLogs as (MaintenanceLog & { createdBy: { name: string } | null })[]).map((log) => (
                    <div key={log.id} className="space-y-1">
                      <p className="text-sm text-amber-900">{log.description}</p>
                      {log.estimatedCompletion && (
                        <p className="text-xs text-amber-700">
                          Est. completion: {new Date(log.estimatedCompletion).toLocaleDateString()}
                        </p>
                      )}
                      {log.createdBy && (
                        <p className="text-xs text-amber-600">Reported by {log.createdBy.name}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="border-[var(--fass-border)] bg-white">
              <CardHeader className="pb-3">
                <CardTitle
                  className="text-base font-semibold text-[var(--fass-text)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Location Visual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-[var(--fass-border)] bg-slate-50/80 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--fass-text)]">
                      {room.building?.campus?.name}
                    </p>
                    <Badge variant="outline">Campus map</Badge>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-[var(--fass-border)] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">
                        Building
                      </p>
                      <p className="mt-1 font-semibold text-[var(--fass-text)]">
                        {room.building?.buildingCode} · {room.building?.name}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-dashed border-[var(--fass-border)] bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">
                        Floor
                      </p>
                      <p className="mt-1 font-semibold text-[var(--fass-text)]">Level {room.floor}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--fass-blue)] bg-blue-50 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[var(--fass-blue)]">
                        Room
                      </p>
                      <p className="mt-1 font-semibold text-[var(--fass-text)]">{room.roomNumber}</p>
                      <p className="mt-1 text-xs text-[var(--fass-text-muted)]">
                        This room is anchored in the campus explorer and can be shared with other scheduling modules.
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/campuses"
                  className="inline-flex text-sm font-medium text-[var(--fass-blue)] hover:underline"
                >
                  Open full campus explorer
                </Link>
              </CardContent>
            </Card>

            {/* Assets */}
            <Card className="border-[var(--fass-border)] bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-[var(--fass-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Assets ({room.assets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {room.assets.length === 0 ? (
                  <p className="text-sm text-[var(--fass-text-muted)]">No assets recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {(room.assets as Asset[]).map((asset: Asset) => (
                      <li key={asset.id} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--fass-text)]">{asset.itemName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--fass-text-muted)]">x{asset.quantity}</span>
                          <Badge variant={asset.isFunctional ? 'secondary' : 'destructive'} className="text-xs">
                            {asset.isFunctional ? 'OK' : 'Faulty'}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: Timetable */}
          <div className="lg:col-span-2">
            <TimetableView timetable={timetable} />
          </div>
        </div>
      </div>
    </div>
  );
}
