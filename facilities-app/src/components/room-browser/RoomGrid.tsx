'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Building2, LayoutGrid, List, MapPin, Users } from 'lucide-react';
import RoomCard from './RoomCard';
import Pagination from './Pagination';
import RoomStatusBadge from './RoomStatusBadge';
import { ROOM_TYPE_LABELS } from '@/lib/facilities';
import type { Room } from '@/types';

interface RoomGridProps {
  rooms: Room[];
  total: number;
  page: number;
  totalPages: number;
}

type ViewMode = 'cards' | 'list';

export default function RoomGrid({ rooms, total, page, totalPages }: RoomGridProps) {
  const [sortBy, setSortBy] = useState<'number' | 'capacity' | 'status'>('number');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const sortedRooms = useMemo(() => {
    const nextRooms = [...rooms];
    if (sortBy === 'capacity') {
      return nextRooms.sort((left, right) => right.capacity - left.capacity);
    }
    if (sortBy === 'status') {
      const rank = { AVAILABLE: 0, OCCUPIED: 1, MAINTENANCE: 2 };
      return nextRooms.sort((left, right) => rank[left.currentStatus] - rank[right.currentStatus]);
    }
    return nextRooms.sort((left, right) => left.roomNumber.localeCompare(right.roomNumber));
  }, [rooms, sortBy]);

  if (rooms.length === 0) {
    return (
      <div className="col-span-full py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--fass-bg-light)]">
          <Building2 className="h-8 w-8 text-[var(--fass-text-muted)]" />
        </div>
        <p className="text-lg font-medium text-[var(--fass-text-muted)]">No rooms match your filters</p>
        <p className="mt-1 text-sm text-[var(--fass-text-muted)]">Try adjusting campus, building, or capacity filters.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 rounded-[1.5rem] border border-[var(--fass-border)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-[var(--fass-text-muted)]">
              Showing <span className="font-semibold text-[var(--fass-text)]">{rooms.length}</span> of{' '}
              <span className="font-semibold text-[var(--fass-text)]">{total}</span> rooms
              {totalPages > 1 ? (
                <span className="ml-1 text-[var(--fass-text-muted)]">page {page} of {totalPages}</span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-light)] p-1">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${viewMode === 'cards'
                    ? 'bg-white text-[var(--fass-blue)] shadow-sm'
                    : 'text-[var(--fass-text-muted)]'
                  }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${viewMode === 'list'
                    ? 'bg-white text-[var(--fass-blue)] shadow-sm'
                    : 'text-[var(--fass-text-muted)]'
                  }`}
              >
                <List className="h-4 w-4" />
                List
              </button>
            </div>

            <div className="relative">
              <select
                className="enterprise-native-select h-10 rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)]"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              >
                <option value="number">Sort by room number</option>
                <option value="capacity">Sort by capacity</option>
                <option value="status">Sort by status</option>
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sortedRooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.id}`}
              className="block rounded-[1.5rem] border border-[var(--fass-border)] bg-white p-4 shadow-sm transition hover:border-[var(--fass-blue)]"
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_minmax(0,0.9fr)] xl:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-[var(--fass-text)]">{room.roomNumber}</p>
                    <RoomStatusBadge status={room.currentStatus} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-[var(--fass-text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {room.building?.campus?.name ?? room.building?.name ?? 'Unassigned building'}
                      {room.building?.buildingCode ? ` · ${room.building.buildingCode}` : ''}
                    </span>
                    <span>{ROOM_TYPE_LABELS[room.roomType]}</span>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-3">
                  <div className="rounded-2xl bg-[var(--fass-bg-light)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Capacity</p>
                    <p className="mt-1 font-semibold text-[var(--fass-text)]">{room.capacity} seats</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--fass-bg-light)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Floor</p>
                    <p className="mt-1 font-semibold text-[var(--fass-text)]">{room.floor}</p>
                  </div>
                  <div className="rounded-2xl bg-[var(--fass-bg-light)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Tags</p>
                    <p className="mt-1 font-semibold text-[var(--fass-text)]">{room.tags?.length ?? 0}</p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--fass-bg-light)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Assets</p>
                    <p className="mt-1 font-semibold text-[var(--fass-text)]">{room.assets?.length ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-[color:color-mix(in_srgb,var(--fass-blue)_8%,white)] px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Open</p>
                    <p className="mt-1 font-semibold text-[var(--fass-blue)]">Room profile</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} />
    </div>
  );
}
