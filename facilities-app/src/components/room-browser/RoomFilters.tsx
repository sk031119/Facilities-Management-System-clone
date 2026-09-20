'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Building2,
  Layers3,
  MapPin,
  Search,
  SlidersHorizontal,
  Tag,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ROOM_TYPE_OPTIONS } from '@/lib/facilities';
import type { Building, Campus, Tag as TagType } from '@/types';

interface RoomFiltersProps {
  campuses: Campus[];
  buildings: Building[];
  tags: TagType[];
}

const fieldShellClass =
  'flex h-10 items-center gap-3 rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-4';

const selectClass =
  'enterprise-native-select h-full w-full border-0 bg-transparent px-0 pr-6 text-sm text-[var(--fass-text)] outline-none shadow-none';

function FilterSelect({
  icon,
  value,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`${fieldShellClass} relative`}>
      <span className="shrink-0 text-[var(--fass-text-muted)]">{icon}</span>
      <select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
      <ArrowRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
    </div>
  );
}

export default function RoomFilters({ campuses, buildings, tags }: RoomFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') params.set(key, value);
      else params.delete(key);
      params.delete('page');
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const clearFilters = () => {
    router.push(pathname);
  };

  const hasFilters =
    searchParams.has('campusId') ||
    searchParams.has('buildingId') ||
    searchParams.has('tagId') ||
    searchParams.has('status') ||
    searchParams.has('roomType') ||
    searchParams.has('minCapacity') ||
    searchParams.has('maxCapacity') ||
    searchParams.has('q');

  return (
    <section className="mb-6 rounded-[1.9rem] border border-[var(--fass-border)] bg-white p-3.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[var(--fass-blue)]" />
          <h2 className="text-base font-semibold text-[var(--fass-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
            Filters
          </h2>
        </div>

        {hasFilters ? (
          <Button variant="outline" className="h-9 rounded-xl border-[var(--fass-border)]" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2.5 xl:grid-cols-2 2xl:grid-cols-12">
        <div className="relative 2xl:col-span-4">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
          <Input
            className="h-10 rounded-xl border-[var(--fass-border)] bg-[var(--fass-bg-white)] pl-11"
            placeholder="Search room or building"
            defaultValue={searchParams.get('q') ?? ''}
            onChange={(event) => updateParam('q', event.target.value)}
          />
        </div>

        <div className="2xl:col-span-2">
          <FilterSelect
            icon={<MapPin className="h-4 w-4" />}
            value={String(searchParams.get('campusId') ?? 'all')}
            onChange={(value) => updateParam('campusId', value)}
          >
            <option value="all">All campuses</option>
            {campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </FilterSelect>
        </div>

        <div className="2xl:col-span-2">
          <FilterSelect
            icon={<Building2 className="h-4 w-4" />}
            value={String(searchParams.get('buildingId') ?? 'all')}
            onChange={(value) => updateParam('buildingId', value)}
          >
            <option value="all">All buildings</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.buildingCode} · {building.name}
              </option>
            ))}
          </FilterSelect>
        </div>

        <div className="2xl:col-span-2">
          <FilterSelect
            icon={<Layers3 className="h-4 w-4" />}
            value={String(searchParams.get('roomType') ?? 'all')}
            onChange={(value) => updateParam('roomType', value)}
          >
            <option value="all">All types</option>
            {ROOM_TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </FilterSelect>
        </div>

        <div className="2xl:col-span-2">
          <FilterSelect
            icon={<Tag className="h-4 w-4" />}
            value={String(searchParams.get('tagId') ?? 'all')}
            onChange={(value) => updateParam('tagId', value)}
          >
            <option value="all">All features</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.tagName}
              </option>
            ))}
          </FilterSelect>
        </div>

        <div className="2xl:col-span-2">
          <FilterSelect
            icon={<Layers3 className="h-4 w-4" />}
            value={String(searchParams.get('status') ?? 'all')}
            onChange={(value) => updateParam('status', value)}
          >
            <option value="all">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="MAINTENANCE">Maintenance</option>
          </FilterSelect>
        </div>

        <div className="relative 2xl:col-span-1">
          <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
          <Input
            className="h-10 rounded-xl border-[var(--fass-border)] bg-[var(--fass-bg-white)] pl-11"
            placeholder="Min seats"
            type="number"
            min={1}
            defaultValue={searchParams.get('minCapacity') ?? ''}
            onChange={(event) => updateParam('minCapacity', event.target.value)}
          />
        </div>

        <div className="relative 2xl:col-span-1">
          <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
          <Input
            className="h-10 rounded-xl border-[var(--fass-border)] bg-[var(--fass-bg-white)] pl-11"
            placeholder="Max seats"
            type="number"
            min={1}
            defaultValue={searchParams.get('maxCapacity') ?? ''}
            onChange={(event) => updateParam('maxCapacity', event.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
