'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CarFront,
  ListTree,
  LocateFixed,
  Map,
  MapPin,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import RoomStatusBadge from '@/components/room-browser/RoomStatusBadge';
import CampusLeafletMap from './CampusLeafletMap';
import IndoorLeafletMap from './IndoorLeafletMap';
import { getIndoorMapModel } from '@/lib/campus-map';
import { formatCampusLocationLabel, groupRoomsByFloor, ROOM_TYPE_LABELS, sortRoomsForDisplay } from '@/lib/facilities';
import type { Building, Campus, Room } from '@/types';

type ExplorerRoom = Room;
type ExplorerView = 'campus' | 'indoor' | 'directory';

interface ExplorerBuilding extends Building {
  rooms: ExplorerRoom[];
}

interface ExplorerCampus extends Campus {
  buildings: ExplorerBuilding[];
}

interface CampusExplorerProps {
  campuses: ExplorerCampus[];
  compact?: boolean;
  initialCampusId?: string;
  initialBuildingId?: string;
  initialRoomId?: string;
  initialView?: ExplorerView;
}

const viewMeta: Record<ExplorerView, { label: string; icon: typeof Map }> = {
  campus: {
    label: 'Campus map',
    icon: Map,
  },
  indoor: {
    label: 'Indoor navigator',
    icon: LocateFixed,
  },
  directory: {
    label: 'Room index',
    icon: ListTree,
  },
};

export default function CampusExplorer({
  campuses,
  compact = false,
  initialCampusId = '',
  initialBuildingId = '',
  initialRoomId = '',
  initialView = 'campus',
}: CampusExplorerProps) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ExplorerView>(initialView);
  const [selectedCampusId, setSelectedCampusId] = useState<string>(initialCampusId);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(initialBuildingId);
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [focusedRoomId, setFocusedRoomId] = useState<string>(initialRoomId);
  const [showParking, setShowParking] = useState(true);
  const [showFood, setShowFood] = useState(true);
  const [showEntries, setShowEntries] = useState(true);

  const filteredCampuses = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    const nextCampuses = !normalized
      ? campuses
      : campuses
        .map((campus) => {
          const buildings = campus.buildings
            .map((building) => ({
              ...building,
              rooms: building.rooms.filter((room) =>
                [
                  room.roomNumber,
                  room.description ?? '',
                  building.name,
                  building.buildingCode,
                  building.mapLabel ?? '',
                  campus.name,
                  campus.address,
                  campus.mapLocationLabel ?? '',
                ]
                  .join(' ')
                  .toLowerCase()
                  .includes(normalized)
              ),
            }))
            .filter(
              (building) =>
                building.rooms.length > 0 ||
                building.name.toLowerCase().includes(normalized) ||
                building.buildingCode.toLowerCase().includes(normalized)
            );

          const campusMatches = `${campus.name} ${campus.address} ${campus.mapLocationLabel ?? ''}`
            .toLowerCase()
            .includes(normalized);

          if (!campusMatches && buildings.length === 0) return null;

          return {
            ...campus,
            buildings: campusMatches ? campus.buildings : buildings,
          };
        })
        .filter((campus): campus is ExplorerCampus => Boolean(campus));

    return [...nextCampuses].sort((left, right) => left.name.localeCompare(right.name));
  }, [campuses, search]);

  const selectedCampus = useMemo(
    () => filteredCampuses.find((campus) => campus.id === selectedCampusId) ?? filteredCampuses[0] ?? null,
    [filteredCampuses, selectedCampusId]
  );

  const selectedBuilding = useMemo(
    () =>
      selectedCampus?.buildings.find((building) => building.id === selectedBuildingId) ??
      selectedCampus?.buildings[0] ??
      null,
    [selectedBuildingId, selectedCampus]
  );

  const floors = useMemo(() => {
    if (!selectedBuilding) return [];
    return Object.entries(groupRoomsByFloor(selectedBuilding.rooms)).sort(
      ([left], [right]) => Number(right) - Number(left)
    );
  }, [selectedBuilding]);

  const selectedFloorLabel = selectedFloor || floors[0]?.[0] || '1';

  const selectedFloorRooms = useMemo(() => {
    const currentFloor = floors.find(([floor]) => floor === selectedFloorLabel) ?? floors[0];
    return currentFloor ? sortRoomsForDisplay(currentFloor[1]) : [];
  }, [floors, selectedFloorLabel]);

  const focusedRoom = useMemo(
    () => selectedFloorRooms.find((room) => room.id === focusedRoomId) ?? selectedFloorRooms[0] ?? null,
    [focusedRoomId, selectedFloorRooms]
  );

  const indoorModel = useMemo(
    () => (selectedBuilding ? getIndoorMapModel(selectedBuilding, selectedFloorLabel, selectedFloorRooms) : null),
    [selectedBuilding, selectedFloorLabel, selectedFloorRooms]
  );

  const focusedGeometry = useMemo(
    () => indoorModel?.rooms.find((room) => room.roomId === focusedRoom?.id) ?? indoorModel?.rooms[0] ?? null,
    [focusedRoom?.id, indoorModel]
  );

  const portfolioStats = useMemo(
    () =>
      filteredCampuses.reduce(
        (acc, campus) => {
          acc.campuses += 1;
          acc.buildings += campus.buildings.length;
          acc.rooms += campus.buildings.reduce((roomAcc, building) => roomAcc + building.rooms.length, 0);
          return acc;
        },
        { campuses: 0, buildings: 0, rooms: 0 }
      ),
    [filteredCampuses]
  );

  const selectedCampusTotals = useMemo(() => {
    if (!selectedCampus) return { buildings: 0, rooms: 0 };
    return {
      buildings: selectedCampus.buildings.length,
      rooms: selectedCampus.buildings.reduce((sum, building) => sum + building.rooms.length, 0),
    };
  }, [selectedCampus]);

  const floorStatusSummary = useMemo(
    () =>
      selectedFloorRooms.reduce(
        (acc, room) => {
          if (room.currentStatus === 'AVAILABLE') acc.available += 1;
          if (room.currentStatus === 'OCCUPIED') acc.occupied += 1;
          if (room.currentStatus === 'MAINTENANCE') acc.maintenance += 1;
          return acc;
        },
        { available: 0, occupied: 0, maintenance: 0 }
      ),
    [selectedFloorRooms]
  );

  const directoryRooms = useMemo(
    () =>
      selectedBuilding
        ? sortRoomsForDisplay(
          selectedBuilding.rooms.map((room) => ({
            ...room,
            floorLabel: `Floor ${room.floor}`,
          }))
        )
        : [],
    [selectedBuilding]
  );

  useEffect(() => {
    if (!selectedCampus && selectedCampusId) setSelectedCampusId('');
    if (selectedCampus && selectedCampus.id !== selectedCampusId) {
      setSelectedCampusId(selectedCampus.id);
    }
  }, [selectedCampus, selectedCampusId]);

  useEffect(() => {
    if (!selectedBuilding && selectedBuildingId) setSelectedBuildingId('');
    if (selectedBuilding && selectedBuilding.id !== selectedBuildingId) {
      setSelectedBuildingId(selectedBuilding.id);
    }
  }, [selectedBuilding, selectedBuildingId]);

  useEffect(() => {
    if (!floors.length) {
      if (selectedFloor) setSelectedFloor('');
      return;
    }
    if (!floors.some(([floor]) => floor === selectedFloor)) {
      setSelectedFloor(floors[0][0]);
    }
  }, [floors, selectedFloor]);

  useEffect(() => {
    if (!selectedFloorRooms.length) {
      if (focusedRoomId) setFocusedRoomId('');
      return;
    }
    if (!selectedFloorRooms.some((room) => room.id === focusedRoomId)) {
      setFocusedRoomId(selectedFloorRooms[0].id);
    }
  }, [focusedRoomId, selectedFloorRooms]);

  const locationLabel = selectedCampus?.mapLocationLabel || (selectedCampus ? formatCampusLocationLabel(selectedCampus.address) : '');

  return (
    <section className="space-y-4">
      <div className="rounded-[1.9rem] border border-[var(--fass-border)] bg-white p-4 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h2
                className="text-2xl font-semibold text-[var(--fass-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {compact ? 'Map workspace' : 'Campus maps'}
              </h2>
              {!compact ? (
                <>
                  <Badge variant="outline">{portfolioStats.campuses} campuses</Badge>
                  <Badge variant="outline">{portfolioStats.buildings} buildings</Badge>
                  <Badge variant="outline">{portfolioStats.rooms} rooms</Badge>
                </>
              ) : null}
            </div>

            <div className="inline-flex flex-wrap rounded-2xl border border-[var(--fass-border)] bg-[var(--fass-bg-light)] p-1">
              {Object.entries(viewMeta).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setView(key as ExplorerView)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${view === key
                        ? 'bg-[var(--fass-bg-white)] text-[var(--fass-blue)] shadow-sm'
                        : 'text-[var(--fass-text-muted)]'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1.35fr)_minmax(220px,0.8fr)_minmax(220px,0.8fr)]">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
              <Input
                className="h-10 rounded-xl border-[var(--fass-border)] bg-[var(--fass-bg-white)] pl-9"
                placeholder="Search campus, building, or room"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="enterprise-native-select h-10 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-4 pr-10 text-sm text-[var(--fass-text)] outline-none"
                value={selectedCampus?.id ?? ''}
                onChange={(event) => {
                  setSelectedCampusId(event.target.value);
                  const nextCampus = filteredCampuses.find((campus) => campus.id === event.target.value);
                  setSelectedBuildingId(nextCampus?.buildings[0]?.id ?? '');
                }}
              >
                {filteredCampuses.length === 0 ? <option value="">No campuses</option> : null}
                {filteredCampuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
            </div>

            <div className="relative">
              <select
                className="enterprise-native-select h-10 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-4 pr-10 text-sm text-[var(--fass-text)] outline-none disabled:cursor-not-allowed disabled:opacity-60"
                value={selectedBuilding?.id ?? ''}
                disabled={!selectedCampus || selectedCampus.buildings.length === 0}
                onChange={(event) => setSelectedBuildingId(event.target.value)}
              >
                {!selectedCampus ? <option value="">Choose campus first</option> : null}
                {selectedCampus && selectedCampus.buildings.length === 0 ? <option value="">No buildings</option> : null}
                {selectedCampus?.buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.buildingCode} · {building.name}
                  </option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
            </div>
          </div>

          {selectedCampus ? (
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline">{locationLabel}</Badge>
              <Badge variant="outline">{selectedCampusTotals.buildings} buildings</Badge>
              <Badge variant="outline">{selectedCampusTotals.rooms} rooms mapped</Badge>
              <Badge variant="outline">{floors.length} floors</Badge>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[2rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
        {!selectedCampus ? (
          <div className="rounded-[1.75rem] border border-dashed border-[var(--fass-border)] p-8 text-center text-[var(--fass-text-muted)]">
            Search or choose a campus to open the map workspace.
          </div>
        ) : !selectedBuilding ? (
          <div className="rounded-[1.75rem] border border-dashed border-[var(--fass-border)] p-8 text-center text-[var(--fass-text-muted)]">
            This campus does not have a building profile yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[var(--fass-blue)] text-white">{selectedBuilding.buildingCode}</Badge>
                  <h3 className="text-2xl font-semibold text-[var(--fass-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                    {selectedBuilding.name}
                  </h3>
                </div>
                <p className="text-sm text-[var(--fass-text-muted)]">
                  {selectedCampus.name} · {locationLabel}
                </p>
                {selectedBuilding.mapLabel ? (
                  <p className="text-xs text-[var(--fass-text-muted)]">Map label: {selectedBuilding.mapLabel}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {floors.map(([floor, rooms]) => (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => setSelectedFloor(floor)}
                    className={`rounded-full px-4 py-2 text-sm transition ${selectedFloorLabel === floor
                        ? 'bg-[var(--fass-blue)] text-white'
                        : 'border border-[var(--fass-border)] bg-[var(--fass-bg-white)] text-[var(--fass-text-muted)]'
                      }`}
                  >
                    Floor {floor} · {rooms.length}
                  </button>
                ))}
              </div>
            </div>

            {view === 'campus' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      key: 'entries',
                      label: 'Entries',
                      icon: MapPin,
                      active: showEntries,
                      toggle: () => setShowEntries((current) => !current),
                    },
                    {
                      key: 'parking',
                      label: 'Parking',
                      icon: CarFront,
                      active: showParking,
                      toggle: () => setShowParking((current) => !current),
                    },
                    {
                      key: 'food',
                      label: 'Food',
                      icon: UtensilsCrossed,
                      active: showFood,
                      toggle: () => setShowFood((current) => !current),
                    },
                  ].map(({ key, label, icon: Icon, active, toggle }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={toggle}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${active
                          ? 'border-[var(--fass-blue)] bg-[color:color-mix(in_srgb,var(--fass-blue)_8%,white)] text-[var(--fass-blue)]'
                          : 'border-[var(--fass-border)] bg-[var(--fass-bg-white)] text-[var(--fass-text-muted)]'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-[var(--fass-border)]">
                  <CampusLeafletMap
                    campus={selectedCampus}
                    selectedBuildingId={selectedBuilding.id}
                    onSelectBuilding={setSelectedBuildingId}
                    showParking={showParking}
                    showFood={showFood}
                    showEntries={showEntries}
                  />
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-[1.25rem] bg-[var(--fass-bg-light)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Campus location</p>
                    <p className="mt-2 text-base font-semibold text-[var(--fass-text)]">{locationLabel}</p>
                    <p className="mt-1 text-sm text-[var(--fass-text-muted)]">Map center and zoom use the campus profile.</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-[var(--fass-bg-light)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Selected building</p>
                    <p className="mt-2 text-base font-semibold text-[var(--fass-text)]">{selectedBuilding.name}</p>
                    <p className="mt-1 text-sm text-[var(--fass-text-muted)]">{selectedBuilding.mapLabel || selectedBuilding.buildingCode}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-[var(--fass-bg-light)] px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Indoor coverage</p>
                    <p className="mt-2 text-base font-semibold text-[var(--fass-text)]">{selectedBuilding.rooms.length} rooms</p>
                    <p className="mt-1 text-sm text-[var(--fass-text-muted)]">{floors.length} mapped floors</p>
                  </div>
                </div>
              </div>
            ) : null}

            {view === 'indoor' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 px-1 py-1">
                  <div>
                    <p className="font-semibold text-[var(--fass-text)]">{selectedBuilding.name}</p>
                    <p className="text-sm text-[var(--fass-text-muted)]">
                      {selectedBuilding.buildingCode} · Floor {selectedFloorLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{selectedFloorRooms.length} rooms</Badge>
                    <Badge variant="outline">{floorStatusSummary.available} available</Badge>
                    <Badge variant="outline">{floorStatusSummary.maintenance} maintenance</Badge>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-[var(--fass-border)]">
                  <IndoorLeafletMap
                    building={selectedBuilding}
                    floorLabel={selectedFloorLabel}
                    rooms={selectedFloorRooms}
                    focusedRoomId={focusedRoom?.id}
                    onFocusRoom={setFocusedRoomId}
                  />
                </div>

                <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="rounded-[1.25rem] border border-[var(--fass-border)] bg-white px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-blue)]">Focused room</p>
                    {focusedRoom ? (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-2xl font-semibold text-[var(--fass-text)]">{focusedRoom.roomNumber}</p>
                            <p className="text-sm text-[var(--fass-text-muted)]">
                              {ROOM_TYPE_LABELS[focusedRoom.roomType]} · Floor {focusedRoom.floor}
                            </p>
                          </div>
                          <RoomStatusBadge status={focusedRoom.currentStatus} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-[1rem] bg-[var(--fass-bg-light)] px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Capacity</p>
                            <p className="mt-2 text-lg font-semibold text-[var(--fass-text)]">{focusedRoom.capacity} seats</p>
                          </div>
                          <div className="rounded-[1rem] bg-[var(--fass-bg-light)] px-3 py-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Wing</p>
                            <p className="mt-2 text-lg font-semibold text-[var(--fass-text)]">
                              {focusedGeometry?.side === 'left' ? 'West teaching wing' : 'East learning wing'}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/rooms/${focusedRoom.id}`}
                          className="inline-flex items-center gap-2 rounded-full bg-[var(--fass-blue)] px-4 py-2 text-sm font-medium text-white"
                        >
                          Open room profile
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[var(--fass-text-muted)]">No room is mapped on this floor yet.</p>
                    )}
                  </div>

                  <div className="rounded-[1.25rem] border border-[var(--fass-border)] bg-white px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-blue)]">Rooms on this floor</p>
                    <div className="mt-3 grid gap-2">
                      {selectedFloorRooms.map((room) => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => setFocusedRoomId(room.id)}
                          className={`flex items-center justify-between rounded-[1rem] px-4 py-3 text-left transition ${focusedRoom?.id === room.id
                              ? 'bg-[var(--fass-bg-light)]'
                              : 'bg-[var(--fass-bg-white)] hover:bg-[var(--fass-bg-light)]'
                            }`}
                        >
                          <div>
                            <p className="font-medium text-[var(--fass-text)]">{room.roomNumber}</p>
                            <p className="text-sm text-[var(--fass-text-muted)]">{ROOM_TYPE_LABELS[room.roomType]}</p>
                          </div>
                          <div className="text-sm text-[var(--fass-text-muted)]">{room.capacity} seats</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {view === 'directory' ? (
              <div className="overflow-hidden rounded-[1.35rem] border border-[var(--fass-border)]">
                <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(120px,0.55fr)_minmax(110px,0.45fr)_minmax(120px,0.6fr)] gap-3 border-b border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">
                  <span>Room</span>
                  <span>Floor</span>
                  <span>Seats</span>
                  <span>Status</span>
                </div>
                <div className="divide-y divide-[var(--fass-border)]">
                  {directoryRooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setSelectedFloor(String(room.floor));
                        setFocusedRoomId(room.id);
                        setView('indoor');
                      }}
                      className="grid w-full grid-cols-[minmax(0,1.2fr)_minmax(120px,0.55fr)_minmax(110px,0.45fr)_minmax(120px,0.6fr)] gap-3 px-6 py-4 text-left transition hover:bg-[var(--fass-bg-light)]"
                    >
                      <div>
                        <p className="font-medium text-[var(--fass-text)]">{room.roomNumber}</p>
                        <p className="text-sm text-[var(--fass-text-muted)]">{ROOM_TYPE_LABELS[room.roomType]}</p>
                      </div>
                      <span className="text-sm text-[var(--fass-text-muted)]">Floor {room.floor}</span>
                      <span className="text-sm text-[var(--fass-text-muted)]">{room.capacity}</span>
                      <div className="flex items-start justify-start">
                        <RoomStatusBadge status={room.currentStatus} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
