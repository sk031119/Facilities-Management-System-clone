import Link from 'next/link';
import { Users, MapPin, ArrowRight, Layers3 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoomStatusBadge from './RoomStatusBadge';
import { ROOM_TYPE_LABELS } from '@/lib/facilities';
import type { Room } from '@/types';

interface RoomCardProps {
  room: Room & {
    building?: { name: string; buildingCode: string; campus?: { name: string } };
    tags?: { id: string; tagName: string; colorCode: string }[];
  };
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/rooms/${room.id}`} className="group block">
      <Card className="relative h-full overflow-hidden rounded-[1.75rem] border border-[var(--fass-border)] bg-white shadow-sm transition duration-200 hover:border-[var(--fass-blue)] hover:shadow-md">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--fass-blue),var(--fass-yellow))]" />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3
                className="text-xl font-bold text-[var(--fass-text)] transition-colors duration-200 group-hover:text-[var(--fass-blue)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {room.roomNumber}
              </h3>
              {room.building && (
                <p className="text-xs text-[var(--fass-text-muted)] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {room.building.campus?.name ?? room.building.name} · {room.building.buildingCode}
                </p>
              )}
            </div>
            <RoomStatusBadge status={room.currentStatus} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[var(--fass-bg-light)] p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Capacity</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--fass-text)]">
                <Users className="w-4 h-4 shrink-0 text-[var(--fass-blue)]" />
                {room.capacity} seats
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--fass-bg-light)] p-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Type</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--fass-text)]">
                <Layers3 className="w-4 h-4 shrink-0 text-[var(--fass-blue)]" />
                {ROOM_TYPE_LABELS[room.roomType]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-[var(--fass-text-muted)]">
            <Users className="w-4 h-4 shrink-0" />
            <span>Floor {room.floor}</span>
            {room.floor !== undefined && (
              <>
                <span className="text-[var(--fass-border)]">·</span>
                <span>{room.assets?.length ?? 0} assets tracked</span>
              </>
            )}
          </div>

          {room.tags && room.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {room.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs px-2 py-0 transition-transform duration-200 hover:scale-105"
                  style={{
                    backgroundColor: `${tag.colorCode}18`,
                    color: tag.colorCode,
                    border: `1px solid ${tag.colorCode}35`,
                  }}
                >
                  {tag.tagName}
                </Badge>
              ))}
              {room.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  +{room.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-[var(--fass-border)]/70 bg-[color:color-mix(in_srgb,var(--fass-bg-light)_55%,transparent)] pt-3">
          <span className="flex items-center gap-1 text-xs font-semibold text-[var(--fass-blue)] transition-all duration-200 group-hover:gap-2">
            View Details
            <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
