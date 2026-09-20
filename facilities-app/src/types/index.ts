// TypeScript interfaces for the Facilities module
// No `any` types allowed per project requirements

// ─── Enums ────────────────────────────────────────────────────────────────────

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type UserRole = 'ADMIN' | 'STAFF' | 'PUBLIC';
export type RoomType = 'CLASSROOM' | 'LAB' | 'LECTURE_HALL' | 'OFFICE' | 'COMMON_AREA' | 'GYM' | 'OTHER';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

// ─── Domain Entities ──────────────────────────────────────────────────────────

export interface Campus {
  id: string;
  name: string;
  address: string;
  timezone: string;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  mapZoom?: number | null;
  mapLocationLabel?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Building {
  id: string;
  campusId: string;
  name: string;
  buildingCode: string;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  mapLabel?: string | null;
  createdAt: Date;
  updatedAt: Date;
  campus?: Campus;
}

export interface Room {
  id: string;
  buildingId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  roomType: RoomType;
  description: string | null;
  currentStatus: RoomStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  building?: Building & { campus?: Campus };
  tags?: Tag[];
  assets?: Asset[];
  maintenanceLogs?: MaintenanceLog[];
}

export interface Tag {
  id: string;
  tagName: string;
  colorCode: string;
  createdAt: Date;
}

export interface Asset {
  id: string;
  roomId: string;
  itemName: string;
  quantity: number;
  isFunctional: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceLog {
  id: string;
  roomId: string;
  createdById: string | null;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  estimatedCompletion: Date | null;
  isActive: boolean;
  resolutionNotes: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: UserSummary | null;
  room?: { roomNumber: string; building?: { buildingCode: string } };
}

export interface RoomStatusHistory {
  id: string;
  roomId: string;
  status: RoomStatus;
  changedAt: Date;
  changedBy: string | null;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ─── Scheduler Integration Types ─────────────────────────────────────────────

export interface SchedulerTimeslot {
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  instructor: string;
  dayOfWeek: string;
}

export interface SchedulerTimetable {
  roomId: string;
  slots: SchedulerTimeslot[];
  isFallback: boolean;
  fetchedAt: string;
}

// ─── API Request Bodies ────────────────────────────────────────────────────────

export interface CreateCampusInput {
  name: string;
  address: string;
  timezone?: string;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  mapZoom?: number | null;
  mapLocationLabel?: string | null;
}

export interface UpdateCampusInput {
  name?: string;
  address?: string;
  timezone?: string;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  mapZoom?: number | null;
  mapLocationLabel?: string | null;
}

export interface CreateBuildingInput {
  campusId: string;
  name: string;
  buildingCode: string;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  mapLabel?: string | null;
}

export interface UpdateBuildingInput {
  name?: string;
  buildingCode?: string;
  campusId?: string;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  mapLabel?: string | null;
}

export interface CreateRoomInput {
  buildingId: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  roomType?: RoomType;
  description?: string;
  currentStatus?: RoomStatus;
  tagIds?: string[];
}

export interface UpdateRoomInput {
  roomNumber?: string;
  floor?: number;
  capacity?: number;
  roomType?: RoomType;
  description?: string;
  currentStatus?: RoomStatus;
  tagIds?: string[];
}

export interface CreateAssetInput {
  itemName: string;
  quantity?: number;
  isFunctional?: boolean;
}

export interface UpdateAssetInput {
  itemName?: string;
  quantity?: number;
  isFunctional?: boolean;
}

export interface CreateMaintenanceLogInput {
  title: string;
  description: string;
  priority?: MaintenancePriority;
  estimatedCompletion?: string;
}

export interface UpdateMaintenanceLogInput {
  title?: string;
  description?: string;
  priority?: MaintenancePriority;
  status?: MaintenanceStatus;
  estimatedCompletion?: string;
  isActive?: boolean;
  resolutionNotes?: string;
}

export interface CreateTagInput {
  tagName: string;
  colorCode?: string;
}

export interface UpdateTagInput {
  tagName?: string;
  colorCode?: string;
}

// ─── API Response Envelopes ───────────────────────────────────────────────────

export type ApiResponse<T> =
  | { data: T; message?: string; error?: never }
  | { error: string; details?: Record<string, string[]>; data?: never };

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── UI-specific Types ────────────────────────────────────────────────────────

export interface RoomFilters {
  campusId: string;
  buildingId: string;
  tagId: string;
  roomType: RoomType | '';
  status: RoomStatus | '';
  q: string;
  minCapacity: string;
  maxCapacity: string;
}

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  roomsInMaintenance: number;
  activeMaintenanceLogs: number;
  totalBuildings: number;
  totalCampuses: number;
}

export interface CampusWithBuildings extends Campus {
  buildings: Building[];
}

export interface RoomStatusSummary {
  campusId: string;
  campusName: string;
  available: number;
  occupied: number;
  maintenance: number;
  total: number;
}
