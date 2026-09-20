'use client';

import { useEffect, useMemo, useRef } from 'react';
import { getCampusMapModel } from '@/lib/campus-map';
import type { Building, Campus, Room } from '@/types';

interface CampusLeafletMapProps {
  campus: (Campus & { buildings: (Building & { rooms: Room[] })[] }) | null;
  selectedBuildingId?: string;
  onSelectBuilding: (buildingId: string) => void;
  showParking: boolean;
  showFood: boolean;
  showEntries: boolean;
}

type LeafletModule = typeof import('leaflet');

export default function CampusLeafletMap({
  campus,
  selectedBuildingId,
  onSelectBuilding,
  showParking,
  showFood,
  showEntries,
}: CampusLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const model = useMemo(() => (campus ? getCampusMapModel(campus) : null), [campus]);

  useEffect(() => {
    let mounted = true;
    let leaflet: LeafletModule | null = null;

    async function setupMap() {
      if (!containerRef.current || !model) return;

      leaflet = await import('leaflet');
      if (!mounted || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const L = leaflet;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.control.zoom({ position: 'topright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const featureGroup = L.featureGroup().addTo(map);
      const selectedShape = model.buildings.find((building) => building.buildingId === selectedBuildingId);

      model.pathways.forEach((pathway) => {
        L.polyline(pathway, {
          color: '#94a3b8',
          weight: 4,
          opacity: 0.6,
          dashArray: '10 12',
        }).addTo(featureGroup);
      });

      model.buildings.forEach((building) => {
        const selected = building.buildingId === selectedBuildingId;
        const polygon = L.polygon(building.polygon, {
          color: selected ? building.accent : '#334155',
          weight: selected ? 4 : 2,
          fillColor: building.accent,
          fillOpacity: selected ? 0.48 : 0.26,
        });

        polygon.addTo(featureGroup);
        polygon.bindTooltip(`${building.buildingCode} · ${building.name} · ${building.rooms} rooms`, {
          direction: 'top',
          sticky: true,
        });
        polygon.on('click', () => onSelectBuilding(building.buildingId));

        const labelIcon = L.divIcon({
          className: 'leaflet-room-label',
          html: `<span>${building.buildingCode}</span>`,
        });
        L.marker([building.centroid.lat, building.centroid.lng], { icon: labelIcon }).addTo(featureGroup);
      });

      model.points
        .filter((point) =>
          point.kind === 'parking' ? showParking : point.kind === 'food' ? showFood : showEntries
        )
        .forEach((point) => {
          const color =
            point.kind === 'parking'
              ? '#0ea5e9'
              : point.kind === 'food'
                ? '#f59e0b'
                : point.kind === 'transit'
                  ? '#8b5cf6'
                  : '#22c55e';

          L.circleMarker([point.lat, point.lng], {
            radius: 8,
            color,
            fillColor: color,
            fillOpacity: 0.95,
            weight: 2,
          })
            .bindTooltip(point.label, { direction: 'top', sticky: true })
            .addTo(featureGroup);
        });

      if (selectedShape) {
        map.fitBounds(L.polygon(selectedShape.polygon).getBounds().pad(2.2));
      } else if (featureGroup.getLayers().length > 0) {
        map.fitBounds(featureGroup.getBounds().pad(0.2));
      } else {
        map.setView([model.center.lat, model.center.lng], model.zoom);
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
  }, [model, onSelectBuilding, selectedBuildingId, showEntries, showFood, showParking]);

  return <div ref={containerRef} className="leaflet-map-shell h-[360px] w-full rounded-[1.5rem]" />;
}
