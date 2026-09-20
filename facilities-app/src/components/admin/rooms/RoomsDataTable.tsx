'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package2,
  ArrowUpRight,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import RoomStatusBadge from '@/components/room-browser/RoomStatusBadge';
import Pagination from '@/components/room-browser/Pagination';
import RoomFormModal from './RoomFormModal';
import DeleteRoomDialog from './DeleteRoomDialog';
import RoomAssetsDialog from './RoomAssetsDialog';
import { ROOM_STATUS_OPTIONS, ROOM_TYPE_LABELS } from '@/lib/facilities';
import type { Room, Building, Tag, RoomStatus } from '@/types';

interface RoomsDataTableProps {
  initialRooms: Room[];
  buildings: Building[];
  tags: Tag[];
  page: number;
  total: number;
  totalPages: number;
  title?: string;
  initialFilters?: {
    q?: string;
    campusId?: string;
    status?: string;
    tagId?: string;
  };
}

type SortKey = 'roomNumber' | 'building' | 'campus' | 'roomType' | 'floor' | 'capacity' | 'status' | 'assets';
type SortDirection = 'asc' | 'desc';

export default function RoomsDataTable({
  initialRooms,
  buildings,
  tags,
  page,
  total,
  totalPages,
  title = 'Room directory',
  initialFilters,
}: RoomsDataTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialFilters?.q ?? '');
  const [campusFilter, setCampusFilter] = useState(initialFilters?.campusId ?? 'all');
  const [statusFilter, setStatusFilter] = useState(initialFilters?.status ?? 'all');
  const [tagFilter, setTagFilter] = useState(initialFilters?.tagId ?? 'all');
  const [formOpen, setFormOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [assetRoom, setAssetRoom] = useState<Room | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('roomNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const campusOptions = useMemo(() => {
    const seen = new Map<string, string>();
    buildings.forEach((building) => {
      if (building.campus?.id && building.campus.name) {
        seen.set(building.campus.id, building.campus.name);
      }
    });
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [buildings]);

  const filtered = useMemo(() => {
    const rank = { AVAILABLE: 0, OCCUPIED: 1, MAINTENANCE: 2 } as const;
    const nextRooms = [...initialRooms];

    nextRooms.sort((left, right) => {
      let comparison = 0;

      if (sortKey === 'building') {
        comparison = (left.building?.buildingCode ?? '').localeCompare(right.building?.buildingCode ?? '');
      } else if (sortKey === 'campus') {
        comparison = (left.building?.campus?.name ?? '').localeCompare(right.building?.campus?.name ?? '');
      } else if (sortKey === 'roomType') {
        comparison = ROOM_TYPE_LABELS[left.roomType].localeCompare(ROOM_TYPE_LABELS[right.roomType]);
      } else if (sortKey === 'floor') {
        comparison = left.floor - right.floor;
      } else if (sortKey === 'capacity') {
        comparison = left.capacity - right.capacity;
      } else if (sortKey === 'status') {
        comparison = rank[left.currentStatus] - rank[right.currentStatus];
      } else if (sortKey === 'assets') {
        comparison = (left.assets?.length ?? 0) - (right.assets?.length ?? 0);
      } else {
        comparison = left.roomNumber.localeCompare(right.roomNumber, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return nextRooms;
  }, [initialRooms, sortDirection, sortKey]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    setSearch('');
    setCampusFilter('all');
    setStatusFilter('all');
    setTagFilter('all');
    router.push(pathname);
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(nextKey);
    setSortDirection('asc');
  }

  function getSortIcon(key: SortKey) {
    if (sortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  }

  function refresh() {
    setFormOpen(false);
    setEditRoom(null);
    setAssetRoom(null);
    setDeleteRoom(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.9rem] border border-[var(--fass-border)] bg-white p-3.5 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--fass-blue)]" />
              <p className="text-lg font-semibold text-[var(--fass-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                {title}
              </p>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {filtered.length} shown · {total} total
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[170px]">
                <select
                  className="enterprise-native-select h-10 w-full rounded-full border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-9 text-sm text-[var(--fass-text)] outline-none"
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as SortKey)}
                >
                  <option value="roomNumber">Room number</option>
                  <option value="campus">Campus</option>
                  <option value="roomType">Type</option>
                  <option value="capacity">Capacity</option>
                  <option value="status">Status</option>
                  <option value="assets">Assets</option>
                </select>
                <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
              </div>
              <Button
                variant="outline"
                className="h-10 rounded-full border-[var(--fass-border)] px-4"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
              <Button
                className="h-10 gap-2 rounded-full bg-[var(--fass-blue)] px-4 text-white hover:bg-[var(--fass-blue-dark)]"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New room
              </Button>
            </div>
          </div>

          <div className="grid gap-2.5 xl:grid-cols-[minmax(250px,1.4fr)_minmax(150px,0.72fr)_minmax(150px,0.72fr)_minmax(150px,0.72fr)] xl:items-center">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
              <Input
                className="h-10 rounded-xl border-[var(--fass-border)] bg-[var(--fass-bg-white)] pl-9"
                placeholder="Search room, building, campus"
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearch(value);
                  updateParam('q', value.trim());
                }}
              />
            </div>

            <div className="relative">
              <select
                className="enterprise-native-select h-10 min-w-0 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)] outline-none"
                value={campusFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  setCampusFilter(value);
                  updateParam('campusId', value);
                }}
              >
                <option value="all">All campuses</option>
                {campusOptions.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
            </div>

            <div className="relative">
              <select
                className="enterprise-native-select h-10 min-w-0 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)] outline-none"
                value={statusFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  setStatusFilter(value);
                  updateParam('status', value);
                }}
              >
                <option value="all">All statuses</option>
                {ROOM_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
            </div>

            <div className="relative">
              <select
                className="enterprise-native-select h-10 min-w-0 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)] outline-none"
                value={tagFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  setTagFilter(value);
                  updateParam('tagId', value);
                }}
              >
                <option value="all">All labels</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.tagName}
                  </option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--fass-border)] bg-white shadow-sm">
        <div className="overflow-x-auto px-6 py-4 lg:px-7">
          <Table className="min-w-[980px] text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">
                  <button type="button" className="inline-flex items-center gap-1.5" onClick={() => toggleSort('roomNumber')}>
                    Room {getSortIcon('roomNumber')}
                  </button>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <button type="button" className="inline-flex items-center gap-1.5" onClick={() => toggleSort('campus')}>
                    Location {getSortIcon('campus')}
                  </button>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <button type="button" className="inline-flex items-center gap-1.5" onClick={() => toggleSort('roomType')}>
                    Type {getSortIcon('roomType')}
                  </button>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <button type="button" className="inline-flex items-center gap-1.5" onClick={() => toggleSort('capacity')}>
                    Capacity {getSortIcon('capacity')}
                  </button>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <button type="button" className="inline-flex items-center gap-1.5" onClick={() => toggleSort('status')}>
                    Status {getSortIcon('status')}
                  </button>
                </TableHead>
                <TableHead className="w-[220px]">Tags</TableHead>
                <TableHead className="whitespace-nowrap">
                  <button type="button" className="inline-flex items-center gap-1.5" onClick={() => toggleSort('assets')}>
                    Assets {getSortIcon('assets')}
                  </button>
                </TableHead>
                <TableHead className="w-[126px] whitespace-nowrap text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-[var(--fass-text-muted)]">
                    No rooms found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-semibold text-[var(--fass-text)]">
                      <div>
                        <p>{room.roomNumber}</p>
                        <p className="text-xs font-normal text-[var(--fass-text-muted)]">Floor {room.floor}</p>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px] text-sm text-[var(--fass-text-muted)]">
                      <p className="font-medium text-[var(--fass-text)]">
                        {(room as Room & { building?: { buildingCode: string } }).building?.buildingCode ?? '—'}
                      </p>
                      <p className="truncate">
                        {(room as Room & { building?: { campus?: { name: string } } }).building?.campus?.name ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--fass-text-muted)]">{ROOM_TYPE_LABELS[room.roomType]}</TableCell>
                    <TableCell>{room.capacity} seats</TableCell>
                    <TableCell>
                      <RoomStatusBadge status={room.currentStatus as RoomStatus} />
                    </TableCell>
                    <TableCell className="max-w-[190px]">
                      <div className="flex flex-wrap gap-1">
                        {((room as Room & { tags?: Tag[] }).tags ?? []).slice(0, 2).map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="text-xs px-1.5 py-0"
                            style={{ backgroundColor: `${tag.colorCode}18`, color: tag.colorCode }}
                          >
                            {tag.tagName}
                          </Badge>
                        ))}
                        {((room as Room & { tags?: Tag[] }).tags ?? []).length > 2 ? (
                          <Badge variant="outline">+{((room as Room & { tags?: Tag[] }).tags ?? []).length - 2}</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl"
                        onClick={() => setAssetRoom(room)}
                      >
                        <Package2 className="mr-2 h-3.5 w-3.5" />
                        {room.assets?.length ?? 0}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/rooms/${room.id}`)}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--fass-text-muted)] hover:text-[var(--fass-blue)]"
                          onClick={() => {
                            setEditRoom(room);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--fass-text-muted)] hover:text-red-500"
                          onClick={() => setDeleteRoom(room)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} />

      <RoomFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditRoom(null);
        }}
        onSuccess={refresh}
        buildings={buildings}
        tags={tags}
        room={editRoom}
      />
      <RoomAssetsDialog
        room={assetRoom}
        open={Boolean(assetRoom)}
        onClose={() => setAssetRoom(null)}
        onSuccess={() => router.refresh()}
      />
      <DeleteRoomDialog
        room={deleteRoom}
        onClose={() => setDeleteRoom(null)}
        onSuccess={refresh}
      />
    </div>
  );
}
