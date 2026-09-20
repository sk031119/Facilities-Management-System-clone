'use client';

import { useEffect, useMemo, useRef } from 'react';
import { getIndoorMapModel } from '@/lib/campus-map';
import type { Building, Room } from '@/types';

interface IndoorLeafletMapProps {
  building: Building;
  floorLabel: string;
  rooms: Room[];
  focusedRoomId?: string;
  onFocusRoom: (roomId: string) => void;
}

type LeafletModule = typeof import('leaflet');

function toMapPoint(x: number, y: number) {
  return [y, x] as [number, number];
}

function toMapBounds(x: number, y: number, width: number, height: number) {
  return [
    [y, x],
    [y + height, x + width],
  ] as [[number, number], [number, number]];
}

function buildFloorPlanSvg(model: ReturnType<typeof getIndoorMapModel>) {
  const zoneFill = {
    wing: '#ffffff',
    service: '#eef3f8',
    commons: '#f4f8fd',
  } as const;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${model.width}" height="${model.height}" viewBox="0 0 ${model.width} ${model.height}">
      <rect width="${model.width}" height="${model.height}" fill="#f7fbff"/>
      <g opacity="0.38">
        <path d="M102 122 H898" stroke="#d7e1ee" stroke-width="2" stroke-linecap="round"/>
        <path d="M104 684 H896" stroke="#d7e1ee" stroke-width="2" stroke-linecap="round"/>
      </g>
      ${model.zones
        .map(
          (zone) => `
        <rect x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}" rx="30" fill="${zoneFill[zone.tone]}" stroke="${zone.tone === 'service' ? '#bed0e4' : '#d8e3f0'}" stroke-width="${zone.tone === 'service' ? '3' : '2'}" ${zone.tone === 'service' ? '' : 'stroke-dasharray="8 8"'} />
        <text x="${zone.x + 20}" y="${zone.y + 34}" font-family="Arial, sans-serif" font-size="18" fill="#8aa0bc" letter-spacing="2.4">${zone.label.toUpperCase()}</text>
      `
        )
        .join('')}
    </svg>
  `;
}

export default function IndoorLeafletMap({
  building,
  floorLabel,
  rooms,
  focusedRoomId,
  onFocusRoom,
}: IndoorLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const model = useMemo(() => getIndoorMapModel(building, floorLabel, rooms), [building, floorLabel, rooms]);

  useEffect(() => {
    let mounted = true;
    let leaflet: LeafletModule | null = null;

    async function setupMap() {
      if (!containerRef.current) return;

      leaflet = await import('leaflet');
      if (!mounted || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const L = leaflet;
      const bounds = [
        [0, 0],
        [model.height, model.width],
      ] as [[number, number], [number, number]];

      const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -1.2,
        maxZoom: 2,
        zoomControl: false,
        attributionControl: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1,
        zoomSnap: 0.25,
      });
      mapRef.current = map;

      L.control.zoom({ position: 'topright' }).addTo(map);

      const floorPlanUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(buildFloorPlanSvg(model))}`;
      L.imageOverlay(floorPlanUri, bounds).addTo(map);

      model.landmarks.forEach((landmark) => {
        const icon = L.divIcon({
          className: 'leaflet-room-label',
          html: `<span>${landmark.label}</span>`,
        });

        L.marker(toMapPoint(landmark.x, landmark.y), { icon }).addTo(map);
      });

      model.rooms.forEach((room) => {
        const selected = room.roomId === focusedRoomId;
        const stroke = selected ? '#007ACC' : room.side === 'left' ? '#0F4C81' : '#64748b';
        const fill =
          room.status === 'AVAILABLE'
            ? '#ecfdf3'
            : room.status === 'OCCUPIED'
              ? '#fff1f2'
              : '#fff7e8';

        L.rectangle(toMapBounds(room.x, room.y, room.width, room.height), {
          color: stroke,
          weight: selected ? 3 : 2,
          fillColor: fill,
          fillOpacity: 0.96,
        })
          .bindTooltip(`${room.roomNumber} · ${room.capacity} seats`, {
            direction: 'top',
            sticky: true,
          })
          .on('click', () => onFocusRoom(room.roomId))
          .addTo(map);

        const roomLabel = L.divIcon({
          className: 'leaflet-room-label',
          html: `<span>${room.roomNumber}</span>`,
        });

        L.marker(toMapPoint(room.center.x, room.y - 18), { icon: roomLabel }).addTo(map);
      });

      if (focusedRoomId) {
        const targetRoom = model.rooms.find((room) => room.roomId === focusedRoomId);
        if (targetRoom) {
          L.polyline(
            [
              ...model.route.slice(0, -1),
              [targetRoom.center.y, targetRoom.center.x],
            ],
            {
              color: '#007ACC',
              weight: 5,
              opacity: 0.72,
              dashArray: '12 10',
            }
          ).addTo(map);
        }
      }

      map.fitBounds(bounds, { padding: [6, 6] });
      map.setMinZoom(map.getZoom());
      if (focusedRoomId) {
        const target = model.rooms.find((room) => room.roomId === focusedRoomId);
        if (target) map.panTo(toMapPoint(target.center.x, target.center.y));
      }

      setTimeout(() => map.invalidateSize(), 0);
    }

    setupMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [focusedRoomId, model, onFocusRoom]);

  return <div ref={containerRef} className="leaflet-map-shell h-[560px] w-full rounded-[1.2rem]" />;
}
