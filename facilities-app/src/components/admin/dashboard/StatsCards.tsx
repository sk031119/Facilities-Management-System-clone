'use client';

import Link from 'next/link';
import { DoorOpen, CheckCircle2, AlertTriangle, Wrench, Building2, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats;
}

const cards = [
  { key: 'totalRooms' as const, label: 'Mapped rooms', icon: DoorOpen, iconStyle: { backgroundColor: 'var(--fass-accent-soft)', color: 'var(--fass-blue)' }, href: '/admin/rooms' },
  { key: 'availableRooms' as const, label: 'Available', icon: CheckCircle2, iconStyle: { backgroundColor: 'var(--status-available-bg)', color: 'var(--status-available)' }, href: '/admin/rooms?status=AVAILABLE' },
  { key: 'occupiedRooms' as const, label: 'Occupied', icon: AlertTriangle, iconStyle: { backgroundColor: 'var(--status-occupied-bg)', color: 'var(--status-occupied)' }, href: '/admin/rooms?status=OCCUPIED' },
  { key: 'roomsInMaintenance' as const, label: 'Maintenance', icon: Wrench, iconStyle: { backgroundColor: 'var(--status-maintenance-bg)', color: 'var(--status-maintenance)' }, href: '/admin/rooms?status=MAINTENANCE' },
  { key: 'activeMaintenanceLogs' as const, label: 'Open issues', icon: Wrench, iconStyle: { backgroundColor: 'color-mix(in srgb, var(--fass-yellow) 18%, var(--fass-bg-light))', color: 'var(--fass-yellow)' }, href: '/admin/maintenance?status=OPEN' },
  { key: 'totalBuildings' as const, label: 'Buildings', icon: Building2, iconStyle: { backgroundColor: 'var(--fass-bg-light)', color: 'var(--fass-text)' }, href: '/admin/buildings' },
  { key: 'totalCampuses' as const, label: 'Campuses', icon: MapPin, iconStyle: { backgroundColor: 'color-mix(in srgb, var(--brand-secondary) 16%, var(--fass-bg-light))', color: 'var(--fass-text)' }, href: '/admin/campuses' },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-7">
      {cards.map(({ key, label, icon: Icon, iconStyle, href }) => (
        <div key={key}>
          <Link href={href} className="block h-full">
            <Card className="group relative h-full overflow-hidden rounded-[1.5rem] border-[var(--fass-border)] bg-white transition hover:border-[var(--fass-blue)] hover:shadow-sm">
              <CardContent className="p-4">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl" style={iconStyle}>
                  <Icon className="h-5 w-5" />
                </div>
                <p
                  className="text-2xl font-bold tabular-nums text-[var(--fass-text)]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {stats[key]}
                </p>
                <p className="mt-0.5 text-xs font-medium text-[var(--fass-text-muted)]">{label}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      ))}
    </div>
  );
}
