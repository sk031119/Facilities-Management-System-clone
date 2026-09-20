import { sortRoomsForDisplay } from '@/lib/facilities';
import type { Building, Campus, Room } from '@/types';

type BuildingWithRooms = Building & { rooms: Room[] };
type CampusWithBuildings = Campus & { buildings: BuildingWithRooms[] };

export interface CampusMapPoint {
  id: string;
  kind: 'parking' | 'food' | 'entry' | 'transit';
  label: string;
  lat: number;
  lng: number;
}

export interface CampusMapBuildingShape {
  buildingId: string;
  buildingCode: string;
  name: string;
  rooms: number;
  polygon: [number, number][];
  centroid: { lat: number; lng: number };
  accent: string;
}

export interface CampusMapModel {
  center: { lat: number; lng: number };
  zoom: number;
  buildings: CampusMapBuildingShape[];
  points: CampusMapPoint[];
  pathways: [number, number][][];
}

export interface IndoorMapZone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tone: 'wing' | 'service' | 'commons';
}

export interface IndoorMapRoomGeometry {
  roomId: string;
  roomNumber: string;
  capacity: number;
  status: Room['currentStatus'];
  side: 'left' | 'right';
  x: number;
  y: number;
  width: number;
  height: number;
  center: { x: number; y: number };
}

export interface IndoorMapModel {
  width: number;
  height: number;
  title: string;
  subtitle: string;
  zones: IndoorMapZone[];
  landmarks: Array<{ id: string; label: string; x: number; y: number }>;
  route: [number, number][];
  rooms: IndoorMapRoomGeometry[];
}

interface CampusTemplate {
  match: string[];
  center: { lat: number; lng: number };
  zoom: number;
  points: Array<Omit<CampusMapPoint, 'lat' | 'lng'> & { dx: number; dy: number }>;
  pathways: Array<Array<{ dx: number; dy: number }>>;
  buildings: Record<string, [number, number][]>;
}

const FALLBACK_TEMPLATE: CampusTemplate = {
  match: [],
  center: { lat: 43.6672, lng: -79.5231 },
  zoom: 15,
  points: [
    { id: 'parking', kind: 'parking', label: 'Parking', dx: -0.0018, dy: -0.0012 },
    { id: 'entry', kind: 'entry', label: 'Main entry', dx: 0.0012, dy: 0.0008 },
  ],
  pathways: [
    [
      { dx: -0.0018, dy: -0.0012 },
      { dx: -0.0002, dy: -0.0002 },
      { dx: 0.0012, dy: 0.0008 },
    ],
  ],
  buildings: {},
};

const CAMPUS_TEMPLATES: CampusTemplate[] = [
  {
    match: ['lakeshore', 'lake shore'],
    center: { lat: 43.59415, lng: -79.52842 },
    zoom: 16,
    points: [
      { id: 'transit-hub', kind: 'transit', label: 'Transit loop', dx: -0.0022, dy: 0.00145 },
      { id: 'parking-west', kind: 'parking', label: 'Visitor parking', dx: -0.00195, dy: -0.00135 },
      { id: 'parking-east', kind: 'parking', label: 'Staff parking', dx: 0.00235, dy: -0.0011 },
      { id: 'cafe', kind: 'food', label: 'Commons cafe', dx: 0.00145, dy: 0.0005 },
      { id: 'food-hall', kind: 'food', label: 'Food hall', dx: -0.00055, dy: -0.00065 },
      { id: 'main-entry', kind: 'entry', label: 'Main arrival', dx: -0.00035, dy: 0.00078 },
      { id: 'south-entry', kind: 'entry', label: 'South entry', dx: 0.00155, dy: 0.00105 },
    ],
    pathways: [
      [
        { dx: -0.00225, dy: 0.0014 },
        { dx: -0.00055, dy: 0.00085 },
        { dx: 0.0011, dy: 0.00045 },
      ],
      [
        { dx: -0.0018, dy: -0.0012 },
        { dx: -0.00025, dy: -0.00025 },
        { dx: 0.00175, dy: 0.00025 },
      ],
    ],
    buildings: {
      LB: [
        [43.59452, -79.52918],
        [43.59452, -79.52822],
        [43.59398, -79.52822],
        [43.59398, -79.52918],
      ],
      A: [
        [43.5947, -79.52742],
        [43.5947, -79.5268],
        [43.59433, -79.5268],
        [43.59433, -79.52742],
      ],
    },
  },
  {
    match: ['north'],
    center: { lat: 43.72903, lng: -79.60818 },
    zoom: 16,
    points: [
      { id: 'bus-loop', kind: 'transit', label: 'Bus loop', dx: -0.0021, dy: 0.00125 },
      { id: 'parking-garage', kind: 'parking', label: 'Parking garage', dx: 0.002, dy: -0.0013 },
      { id: 'surface-lot', kind: 'parking', label: 'North lot', dx: -0.00185, dy: -0.0015 },
      { id: 'student-cafe', kind: 'food', label: 'Student cafe', dx: 0.0013, dy: 0.00035 },
      { id: 'bookstore-entry', kind: 'entry', label: 'Bookstore entry', dx: -0.00055, dy: 0.00092 },
      { id: 'main-entry', kind: 'entry', label: 'Main entry', dx: 0.00155, dy: 0.00105 },
    ],
    pathways: [
      [
        { dx: -0.00205, dy: 0.0012 },
        { dx: -0.00025, dy: 0.0005 },
        { dx: 0.00145, dy: 0.0005 },
      ],
      [
        { dx: -0.0018, dy: -0.0013 },
        { dx: -0.0001, dy: -0.0001 },
        { dx: 0.00195, dy: 0.0002 },
      ],
    ],
    buildings: {
      NX: [
        [43.72942, -79.60892],
        [43.72942, -79.60784],
        [43.72872, -79.60784],
        [43.72872, -79.60892],
      ],
      H: [
        [43.7292, -79.60715],
        [43.7292, -79.60652],
        [43.72884, -79.60652],
        [43.72884, -79.60715],
      ],
    },
  },
];

function resolveCampusTemplate(campus: Campus) {
  const normalized = `${campus.name} ${campus.address}`.toLowerCase();

  return CAMPUS_TEMPLATES.find((template) =>
    template.match.some((token) => normalized.includes(token))
  ) ?? FALLBACK_TEMPLATE;
}

function resolveCampusCenter(campus: Campus, template: CampusTemplate) {
  if (campus.mapLatitude && campus.mapLongitude) {
    return {
      lat: campus.mapLatitude,
      lng: campus.mapLongitude,
      zoom: campus.mapZoom ?? template.zoom,
    };
  }

  return {
    lat: template.center.lat,
    lng: template.center.lng,
    zoom: campus.mapZoom ?? template.zoom,
  };
}

function polygonCentroid(polygon: [number, number][]) {
  const lat = polygon.reduce((sum, point) => sum + point[0], 0) / polygon.length;
  const lng = polygon.reduce((sum, point) => sum + point[1], 0) / polygon.length;
  return { lat, lng };
}

function fallbackBuildingPolygon(center: { lat: number; lng: number }, index: number) {
  const row = Math.floor(index / 3);
  const col = index % 3;
  const baseLat = center.lat + (1 - row) * 0.00092;
  const baseLng = center.lng + (col - 1) * 0.00118 + (row % 2) * 0.00018;
  const width = 0.00058 + (index % 2) * 0.00008;
  const height = 0.00034 + ((index + 1) % 2) * 0.00006;

  return [
    [baseLat, baseLng],
    [baseLat, baseLng + width],
    [baseLat - height, baseLng + width],
    [baseLat - height, baseLng],
  ] as [number, number][];
}

function buildingAccent(index: number) {
  const accents = ['#007ACC', '#0F4C81', '#D7B742', '#3B82F6', '#0F766E', '#A16207'];
  return accents[index % accents.length];
}

function polygonFromMarker(lat: number, lng: number, index: number) {
  const width = 0.00042 + (index % 2) * 0.00006;
  const height = 0.00026 + ((index + 1) % 2) * 0.00005;
  return [
    [lat + height, lng - width],
    [lat + height, lng + width],
    [lat - height, lng + width],
    [lat - height, lng - width],
  ] as [number, number][];
}

export function getCampusMapModel(campus: CampusWithBuildings): CampusMapModel {
  const template = resolveCampusTemplate(campus);
  const resolvedCenter = resolveCampusCenter(campus, template);

  const buildings = campus.buildings.map((building, index) => {
    const polygon =
      building.mapLatitude && building.mapLongitude
        ? polygonFromMarker(building.mapLatitude, building.mapLongitude, index)
        :
      template.buildings[building.buildingCode.toUpperCase()] ??
      fallbackBuildingPolygon(resolvedCenter, index);

    return {
      buildingId: building.id,
      buildingCode: building.buildingCode,
      name: building.name,
      rooms: building.rooms.length,
      polygon,
      centroid: polygonCentroid(polygon),
      accent: buildingAccent(index),
    };
  });

  const points = template.points.map((point) => ({
    id: point.id,
    kind: point.kind,
    label: point.label,
    lat: resolvedCenter.lat + point.dy,
    lng: resolvedCenter.lng + point.dx,
  }));

  const pathways = template.pathways.map((path) =>
    path.map((point) => [resolvedCenter.lat + point.dy, resolvedCenter.lng + point.dx] as [number, number])
  );

  return {
    center: { lat: resolvedCenter.lat, lng: resolvedCenter.lng },
    zoom: resolvedCenter.zoom,
    buildings,
    points,
    pathways,
  };
}

export function getIndoorMapModel(building: Building, floor: string, rooms: Room[]): IndoorMapModel {
  const orderedRooms = sortRoomsForDisplay(rooms);
  const height = 760;
  const width = 1000;
  const totalRows = Math.max(1, Math.ceil(orderedRooms.length / 2));
  const rowGap = Math.max(88, Math.floor(420 / Math.max(totalRows, 1)));

  const roomGeometries = orderedRooms.map((room, index) => {
    const side = index % 2 === 0 ? 'left' : 'right';
    const row = Math.floor(index / 2);
    const x = side === 'left' ? 102 + (row % 2) * 16 : 674 - (row % 2) * 18;
    const y = 154 + row * rowGap;
    const widthValue = 224;
    const heightValue = 62;

    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      status: room.currentStatus,
      side,
      x,
      y,
      width: widthValue,
      height: heightValue,
      center: { x: x + widthValue / 2, y: y + heightValue / 2 },
    } satisfies IndoorMapRoomGeometry;
  });

  const focusedRoom = roomGeometries[0];
  const targetX = focusedRoom?.center.x ?? 500;
  const targetY = focusedRoom?.center.y ?? 240;

  return {
    width,
    height,
    title: `${building.name} indoor navigator`,
    subtitle: `${building.buildingCode} · Floor ${floor}`,
    zones: [
      { id: 'north-entry', label: 'North arrival', x: 120, y: 54, width: 180, height: 54, tone: 'commons' },
      { id: 'commons', label: 'Student commons', x: 690, y: 54, width: 210, height: 54, tone: 'commons' },
      { id: 'west-wing', label: 'West teaching wing', x: 84, y: 126, width: 272, height: 560, tone: 'wing' },
      { id: 'service-core', label: 'Service spine', x: 412, y: 104, width: 176, height: 600, tone: 'service' },
      { id: 'east-wing', label: 'East learning wing', x: 644, y: 126, width: 272, height: 560, tone: 'wing' },
      { id: 'support-desk', label: 'Wayfinding desk', x: 390, y: 54, width: 220, height: 44, tone: 'commons' },
    ],
    landmarks: [
      { id: 'lobby', label: 'Lobby', x: 240, y: 84 },
      { id: 'core', label: 'Elevator', x: 500, y: 164 },
      { id: 'stairs', label: 'Stairs', x: 500, y: 624 },
    ],
    route: [
      [84, 200],
      [110, 340],
      [170, 500],
      [targetY, targetX],
    ],
    rooms: roomGeometries,
  };
}
