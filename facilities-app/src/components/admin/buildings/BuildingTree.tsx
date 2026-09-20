'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  MapPin,
  Pencil,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import CampusFormModal from './CampusFormModal';
import { formatCampusLocationLabel } from '@/lib/facilities';
import type { Building, Campus, CampusWithBuildings } from '@/types';

interface BuildingTreeProps {
  campuses: CampusWithBuildings[];
}

type CampusRecord = Omit<CampusWithBuildings, 'buildings'> & {
  buildings: (Building & { _count?: { rooms: number } })[];
};

function getBuildingRoomCount(building: Building & { _count?: { rooms: number } }) {
  return building._count?.rooms ?? 0;
}

export default function BuildingTree({ campuses }: BuildingTreeProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const [campusFormOpen, setCampusFormOpen] = useState(false);
  const [editCampus, setEditCampus] = useState<Campus | null>(null);

  const deferredSearch = useDeferredValue(search);

  const typedCampuses = campuses as CampusRecord[];

  const filteredCampuses = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();
    if (!normalized) return typedCampuses;

    return typedCampuses
      .map((campus) => {
        const matchingBuildings = campus.buildings.filter((building) => {
          const haystack = `${building.name} ${building.buildingCode} ${campus.name} ${campus.address}`.toLowerCase();
          return haystack.includes(normalized);
        });

        const campusMatch = `${campus.name} ${campus.address}`.toLowerCase().includes(normalized);
        if (!campusMatch && matchingBuildings.length === 0) return null;

        return { ...campus, buildings: campusMatch ? campus.buildings : matchingBuildings };
      })
      .filter((campus): campus is CampusRecord => Boolean(campus));
  }, [deferredSearch, typedCampuses]);

  const summary = useMemo(() => {
    return typedCampuses.reduce(
      (acc, campus) => {
        acc.campuses += 1;
        acc.buildings += campus.buildings.length;
        acc.rooms += campus.buildings.reduce((roomAcc, building) => roomAcc + getBuildingRoomCount(building), 0);
        return acc;
      },
      { campuses: 0, buildings: 0, rooms: 0 }
    );
  }, [typedCampuses]);

  function refresh() {
    router.refresh();
    setCampusFormOpen(false);
    setEditCampus(null);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.9rem] border border-[var(--fass-border)] bg-white p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)_auto] xl:items-center">
          <div className="min-w-0 space-y-2">
            <h2
              className="text-2xl font-semibold text-[var(--fass-text)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Campus registry
            </h2>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="outline">{summary.campuses} campuses</Badge>
              <Badge variant="outline">{summary.buildings} buildings linked</Badge>
              <Badge variant="outline">{summary.rooms} rooms mapped</Badge>
            </div>
          </div>

          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
            <Input
              className="h-10 rounded-xl border-[var(--fass-border)] pl-9"
              placeholder="Search a campus or address"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex justify-start xl:justify-end">
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-full border-[var(--fass-border)]"
              onClick={() => {
                setEditCampus(null);
                setCampusFormOpen(true);
              }}
            >
              <MapPin className="h-4 w-4" />
              Create campus profile
            </Button>
          </div>
        </div>
      </div>

      {filteredCampuses.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[var(--fass-border)] bg-white p-10 text-center">
          <Building2 className="mx-auto h-10 w-10 text-[var(--fass-border)]" />
          <p className="mt-4 text-sm font-medium text-[var(--fass-text)]">No campus or building matched your search</p>
          <p className="mt-1 text-sm text-[var(--fass-text-muted)]">Try another campus name or address.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampuses.map((campus) => {
            const roomCount = campus.buildings.reduce((acc, building) => acc + getBuildingRoomCount(building), 0);

            return (
              <div
                key={campus.id}
                className="overflow-hidden rounded-[2rem] border border-[var(--fass-border)] bg-white shadow-sm"
              >
                <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl font-semibold text-[var(--fass-text)]">{campus.name}</p>
                      <Badge variant="outline">{campus.buildings.length} buildings</Badge>
                      <Badge variant="outline">{roomCount} rooms</Badge>
                    </div>
                    <p className="text-sm text-[var(--fass-text-muted)]">{campus.address}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-[var(--fass-text-muted)]">
                      <span>{campus.mapLocationLabel || formatCampusLocationLabel(campus.address)}</span>
                      <span>Map center: {campus.mapLatitude && campus.mapLongitude ? 'Configured' : 'Using address default'}</span>
                      <span>Zoom: {campus.mapZoom ?? 16}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setEditCampus(campus);
                        setCampusFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Update campus
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CampusFormModal
        open={campusFormOpen}
        onClose={() => {
          setCampusFormOpen(false);
          setEditCampus(null);
        }}
        onSuccess={refresh}
        campus={editCampus}
      />
    </div>
  );
}
