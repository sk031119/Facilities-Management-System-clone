'use client';

import { AlertTriangle, CheckCircle2, Clock3, Wrench } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface OperationsShowcaseProps {
  stats: DashboardStats;
}

export default function OperationsShowcase({ stats }: OperationsShowcaseProps) {
  const readinessRate =
    stats.totalRooms === 0 ? 0 : Math.round((stats.availableRooms / stats.totalRooms) * 100);
  const utilizationRate =
    stats.totalRooms === 0 ? 0 : Math.round((stats.occupiedRooms / stats.totalRooms) * 100);
  const maintenanceRate =
    stats.totalRooms === 0 ? 0 : Math.round((stats.roomsInMaintenance / stats.totalRooms) * 100);

  const summaryCards = [
    {
      label: 'Ready now',
      value: stats.availableRooms,
      meta: `${readinessRate}% of tracked rooms`,
      icon: CheckCircle2,
      tone: {
        backgroundColor: 'var(--status-available-bg)',
        color: 'var(--status-available)',
      },
    },
    {
      label: 'Occupied',
      value: stats.occupiedRooms,
      meta: `${utilizationRate}% in use`,
      icon: Clock3,
      tone: {
        backgroundColor: 'color-mix(in srgb, var(--fass-blue) 12%, var(--fass-bg-light))',
        color: 'var(--fass-blue)',
      },
    },
    {
      label: 'In maintenance',
      value: stats.roomsInMaintenance,
      meta: `${maintenanceRate}% temporarily offline`,
      icon: Wrench,
      tone: {
        backgroundColor: 'var(--status-maintenance-bg)',
        color: 'var(--status-maintenance)',
      },
    },
    {
      label: 'Open issues',
      value: stats.activeMaintenanceLogs,
      meta: `${stats.totalBuildings} buildings across ${stats.totalCampuses} campuses`,
      icon: AlertTriangle,
      tone: {
        backgroundColor: 'var(--status-occupied-bg)',
        color: 'var(--status-occupied)',
      },
    },
  ];

  return (
    <section className="rounded-[2rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(720px,1.2fr)] xl:items-end">
        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fass-blue)] [background:var(--fass-accent-soft)]">
            Operations
          </div>
          <div className="space-y-2">
            <h1
              className="text-3xl font-semibold tracking-tight text-[var(--fass-text)] sm:text-4xl"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Operations overview
            </h1>
            <p className="text-sm text-[var(--fass-text-muted)]">
              {stats.totalRooms} rooms, {stats.totalBuildings} buildings, {stats.totalCampuses} campuses.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, meta, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-[1.5rem] border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={tone}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">
                  {label}
                </p>
              </div>
              <p className="text-3xl font-semibold text-[var(--fass-text)]">{value}</p>
              <p className="mt-1 text-xs text-[var(--fass-text-muted)]">{meta}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
