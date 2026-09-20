import type { Prisma } from '@prisma/client';
import type {
  MaintenancePriority,
  MaintenanceStatus,
  Room,
  RoomStatus,
  RoomType,
  Tag,
} from '@/types';

export const ROOM_STATUS_OPTIONS: Array<{ value: RoomStatus; label: string }> = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
];

export const ROOM_TYPE_OPTIONS: Array<{ value: RoomType; label: string }> = [
  { value: 'CLASSROOM', label: 'Classroom' },
  { value: 'LAB', label: 'Lab' },
  { value: 'LECTURE_HALL', label: 'Lecture Hall' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'COMMON_AREA', label: 'Common Area' },
  { value: 'GYM', label: 'Gym' },
  { value: 'OTHER', label: 'Other' },
];

export const MAINTENANCE_PRIORITY_OPTIONS: Array<{ value: MaintenancePriority; label: string }> = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

export const MAINTENANCE_STATUS_OPTIONS: Array<{ value: MaintenanceStatus; label: string }> = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

export const ROOM_STATUS_META: Record<RoomStatus, { label: string; description: string }> = {
  AVAILABLE: {
    label: 'Available',
    description: 'Ready to be booked right now.',
  },
  OCCUPIED: {
    label: 'Occupied',
    description: 'Currently in use or blocked by a live schedule.',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    description: 'Unavailable because a facility issue is being addressed.',
  },
};

export const ROOM_TYPE_LABELS: Record<RoomType, string> = Object.fromEntries(
  ROOM_TYPE_OPTIONS.map((option) => [option.value, option.label])
) as Record<RoomType, string>;

export const MAINTENANCE_PRIORITY_META: Record<MaintenancePriority, { label: string; tone: string }> = {
  LOW: { label: 'Low', tone: 'text-slate-600 bg-slate-100 border-slate-200' },
  MEDIUM: { label: 'Medium', tone: 'text-sky-700 bg-sky-100 border-sky-200' },
  HIGH: { label: 'High', tone: 'text-amber-700 bg-amber-100 border-amber-200' },
  CRITICAL: { label: 'Critical', tone: 'text-red-700 bg-red-100 border-red-200' },
};

export const MAINTENANCE_STATUS_META: Record<MaintenanceStatus, { label: string; tone: string }> = {
  OPEN: { label: 'Open', tone: 'text-amber-700 bg-amber-100 border-amber-200' },
  IN_PROGRESS: { label: 'In Progress', tone: 'text-blue-700 bg-blue-100 border-blue-200' },
  RESOLVED: { label: 'Resolved', tone: 'text-green-700 bg-green-100 border-green-200' },
};

interface BuildRoomWhereInput {
  buildingId?: string;
  buildingIds?: string[];
  status?: RoomStatus;
  roomType?: RoomType;
  q?: string;
  tagId?: string;
  minCapacity?: number;
  maxCapacity?: number;
}

export function buildRoomWhere(input: BuildRoomWhereInput): Prisma.RoomWhereInput {
  return {
    ...(input.buildingId
      ? { buildingId: input.buildingId }
      : input.buildingIds
        ? { buildingId: { in: input.buildingIds } }
        : {}),
    ...(input.status ? { currentStatus: input.status } : {}),
    ...(input.roomType ? { roomType: input.roomType } : {}),
    ...(input.q
      ? {
          OR: [
            { roomNumber: { contains: input.q, mode: 'insensitive' } },
            { description: { contains: input.q, mode: 'insensitive' } },
            { building: { name: { contains: input.q, mode: 'insensitive' } } },
            { building: { buildingCode: { contains: input.q, mode: 'insensitive' } } },
          ],
        }
      : {}),
    ...(input.tagId ? { roomTags: { some: { tagId: input.tagId } } } : {}),
    ...((input.minCapacity !== undefined || input.maxCapacity !== undefined)
      ? {
          capacity: {
            ...(input.minCapacity !== undefined ? { gte: input.minCapacity } : {}),
            ...(input.maxCapacity !== undefined ? { lte: input.maxCapacity } : {}),
          },
        }
      : {}),
  };
}

export function serializeRoom<T extends { roomTags?: Array<{ tag: Tag }> }>(room: T): T & { tags: Tag[] } {
  return {
    ...room,
    tags: (room.roomTags ?? []).map((roomTag) => roomTag.tag),
  };
}

export function serializeRooms<T extends { roomTags?: Array<{ tag: Tag }> }>(rooms: T[]) {
  return rooms.map((room) => serializeRoom(room));
}

export function groupRoomsByFloor(rooms: Room[]) {
  return rooms.reduce<Record<string, Room[]>>((acc, room) => {
    const key = String(room.floor);
    acc[key] ??= [];
    acc[key].push(room);
    return acc;
  }, {});
}

export interface IndoorMapPin {
  roomId: string;
  roomNumber: string;
  status: RoomStatus;
  capacity: number;
  x: number;
  y: number;
  side: 'left' | 'right';
}

export function sortRoomsForDisplay<T extends Pick<Room, 'roomNumber'>>(rooms: T[]) {
  return [...rooms].sort((left, right) =>
    left.roomNumber.localeCompare(right.roomNumber, undefined, { numeric: true, sensitivity: 'base' })
  );
}

export function createIndoorMapPins<T extends Pick<Room, 'id' | 'roomNumber' | 'currentStatus' | 'capacity'>>(
  rooms: T[]
): IndoorMapPin[] {
  const orderedRooms = sortRoomsForDisplay(rooms);
  return orderedRooms.map((room, index) => {
    const side = index % 2 === 0 ? 'left' : 'right';
    const rowIndex = Math.floor(index / 2);
    const totalRows = Math.max(1, Math.ceil(orderedRooms.length / 2));
    const y = 16 + (rowIndex / Math.max(1, totalRows - 1 || 1)) * 68;
    const offset = (rowIndex % 3) * 4;

    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      status: room.currentStatus,
      capacity: room.capacity,
      x: side === 'left' ? 26 + offset : 74 - offset,
      y,
      side,
    };
  });
}

export function formatCampusLocationLabel(address: string) {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const cleaned = parts.filter((part) => {
    if (/^canada$/i.test(part)) return false;
    if (/^(on|qc|bc|ab|mb|ns|nb|nl|sk|pe|yt|nt|nu)(\s+[A-Z]\d[A-Z]\s?\d[A-Z]\d)?$/i.test(part)) return false;
    if (/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(part)) return false;
    return true;
  });

  const knownCityMatch = cleaned.findLast((part) =>
    /(toronto|etobicoke|mississauga|brampton|milton|waterloo|kitchener|guelph|hamilton|london|ottawa|markham|vaughan|scarborough)/i.test(part)
  );

  const city = knownCityMatch ?? cleaned.at(-1) ?? parts.at(-1) ?? address;
  return `${city}, CA`;
}
