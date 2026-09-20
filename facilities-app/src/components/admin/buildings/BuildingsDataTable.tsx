'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Building2, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BuildingFormModal from './BuildingFormModal';
import { formatCampusLocationLabel } from '@/lib/facilities';
import type { CampusWithBuildings, Building } from '@/types';

interface BuildingsDataTableProps {
  campuses: CampusWithBuildings[];
}

interface BuildingWithCount extends Building {
  _count?: { rooms: number };
}

export default function BuildingsDataTable({ campuses }: BuildingsDataTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [campusFilter, setCampusFilter] = useState('all');
  const [buildingFormOpen, setBuildingFormOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState<BuildingWithCount | null>(null);
  const deferredSearch = useDeferredValue(search);

  const filteredCampuses = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();

    return campuses
      .filter((campus) => campusFilter === 'all' || campus.id === campusFilter)
      .map((campus) => ({
        ...campus,
        buildings: campus.buildings.filter((building) => {
          if (!normalized) return true;
          return (
            building.name.toLowerCase().includes(normalized) ||
            building.buildingCode.toLowerCase().includes(normalized) ||
            campus.name.toLowerCase().includes(normalized)
          );
        }),
      }))
      .filter((campus) => campus.buildings.length > 0 || !normalized);
  }, [campusFilter, campuses, deferredSearch]);

  function refresh() {
    router.refresh();
    setBuildingFormOpen(false);
    setEditBuilding(null);
  }

  async function deleteBuilding(id: string) {
    if (!confirm('Delete this building? This will fail if rooms are still assigned to it.')) return;
    await fetch(`/api/buildings/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--fass-border)] bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
              <Input
                className="h-10 rounded-xl border-[var(--fass-border)] pl-9"
                placeholder="Search campus, code, or building"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-xl border border-[var(--fass-border)] bg-transparent px-3 text-sm"
              value={campusFilter}
              onChange={(event) => setCampusFilter(event.target.value)}
            >
              <option value="all">All campuses</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              className="gap-2 bg-[var(--fass-blue)] hover:bg-[var(--fass-blue-dark)] text-white"
              onClick={() => setBuildingFormOpen(true)}
            >
              <Plus className="w-4 h-4" /> New Building Profile
            </Button>
          </div>
        </div>
      </div>

      {filteredCampuses.length === 0 ? (
        <div className="text-center py-12 text-[var(--fass-text-muted)]">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-[var(--fass-border)]" />
          <p className="text-sm font-medium">No campus or building matched your filters</p>
          <p className="text-xs mt-1">Try another campus, code, or building name.</p>
        </div>
      ) : (
        filteredCampuses.map((campus) => (
          <Card key={campus.id} className="border-[var(--fass-border)] bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-[var(--fass-text)] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                    <MapPin className="w-4 h-4 text-[var(--fass-blue)]" />
                    {campus.name}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-[var(--fass-text-muted)]">{campus.address} · {formatCampusLocationLabel(campus.address)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {campus.buildings.length === 0 ? (
                <p className="text-sm text-[var(--fass-text-muted)] text-center py-4">No buildings have been mapped for this campus yet.</p>
              ) : (
                <div className="overflow-x-auto px-4 pb-2">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Rooms</TableHead>
                        <TableHead className="w-20 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(campus.buildings as BuildingWithCount[]).map((building) => (
                        <TableRow key={building.id}>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono text-xs">
                              {building.buildingCode}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-[var(--fass-text)]">{building.name}</TableCell>
                          <TableCell className="text-sm text-[var(--fass-text-muted)]">
                            {building._count?.rooms ?? 0} rooms
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[var(--fass-text-muted)] hover:text-[var(--fass-blue)]"
                                onClick={() => { setEditBuilding(building); setBuildingFormOpen(true); }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[var(--fass-text-muted)] hover:text-red-500"
                                onClick={() => deleteBuilding(building.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <BuildingFormModal
        open={buildingFormOpen}
        onClose={() => { setBuildingFormOpen(false); setEditBuilding(null); }}
        onSuccess={refresh}
        campuses={campuses}
        building={editBuilding}
      />
    </div>
  );
}
