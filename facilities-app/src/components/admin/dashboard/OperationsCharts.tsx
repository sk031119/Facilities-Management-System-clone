import { Activity, Donut, Gauge, Radar } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface OperationsChartsProps {
  stats: DashboardStats;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function StatusLegendCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[1.05rem] bg-[var(--fass-bg-light)] px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm text-[var(--fass-text)]">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      <span className="text-lg font-semibold text-[var(--fass-text)]">{value}</span>
    </div>
  );
}

export default function OperationsCharts({ stats }: OperationsChartsProps) {
  const totalRooms = Math.max(stats.totalRooms, 1);
  const availableAngle = (stats.availableRooms / totalRooms) * 360;
  const occupiedAngle = (stats.occupiedRooms / totalRooms) * 360;
  const maintenanceAngle = (stats.roomsInMaintenance / totalRooms) * 360;
  const readinessRate = Math.round((stats.availableRooms / totalRooms) * 100);
  const utilizationRate = Math.round((stats.occupiedRooms / totalRooms) * 100);
  const maintenanceRate = Math.round((stats.roomsInMaintenance / totalRooms) * 100);

  const rateRows = [
    { label: 'Ready for scheduling', value: readinessRate, color: 'var(--status-available)' },
    { label: 'Currently occupied', value: utilizationRate, color: 'var(--fass-blue)' },
    { label: 'Temporarily blocked', value: maintenanceRate, color: 'var(--fass-yellow)' },
  ];

  return (
    <div className="grid items-stretch gap-4 xl:grid-cols-3">
      <section className="flex min-h-[430px] h-full flex-col rounded-[1.75rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-[var(--fass-text)]">
          <Donut className="h-4 w-4 text-[var(--fass-blue)]" />
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--fass-blue)]">Room status</p>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-6">
          <div className="relative mx-auto w-fit pt-2">
            <svg viewBox="0 0 120 120" className="h-52 w-52">
              <circle cx="60" cy="60" r="40" fill="none" stroke="var(--fass-bg-light)" strokeWidth="12" />
              <path
                d={describeArc(60, 60, 40, 0, availableAngle)}
                fill="none"
                stroke="var(--status-available)"
                strokeWidth="12"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <path
                d={describeArc(60, 60, 40, availableAngle, availableAngle + occupiedAngle)}
                fill="none"
                stroke="var(--status-occupied)"
                strokeWidth="12"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
              <path
                d={describeArc(60, 60, 40, availableAngle + occupiedAngle, availableAngle + occupiedAngle + maintenanceAngle)}
                fill="none"
                stroke="var(--fass-yellow)"
                strokeWidth="12"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-semibold text-[var(--fass-text)]">{stats.totalRooms}</span>
              <span className="text-sm text-[var(--fass-text-muted)]">tracked</span>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <StatusLegendCard label="Available" value={stats.availableRooms} color="var(--status-available)" />
            <StatusLegendCard label="Occupied" value={stats.occupiedRooms} color="var(--status-occupied)" />
            <StatusLegendCard label="Maintenance" value={stats.roomsInMaintenance} color="var(--fass-yellow)" />
          </div>
        </div>
      </section>

      <section className="flex min-h-[430px] h-full flex-col rounded-[1.75rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-[var(--fass-text)]">
          <Gauge className="h-4 w-4 text-[var(--fass-blue)]" />
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--fass-blue)]">Operating rates</p>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-3">
          {rateRows.map((metric) => (
            <div key={metric.label} className="rounded-[1.1rem] bg-[var(--fass-bg-light)] px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--fass-text)]">{metric.label}</p>
                <span className="text-lg font-semibold text-[var(--fass-text)]">{metric.value}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--fass-bg-white)]">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                />
              </div>
            </div>
          ))}

          <div className="mt-auto grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: 'Readiness', value: readinessRate, color: 'var(--status-available)' },
              { label: 'Utilization', value: utilizationRate, color: 'var(--fass-blue)' },
              { label: 'Maintenance', value: maintenanceRate, color: 'var(--fass-yellow)' },
            ].map((metric) => (
              <div key={metric.label} className="min-w-0 rounded-[1.2rem] bg-[var(--fass-bg-light)] px-1 py-3 text-center">
                <p className="min-h-8 text-[10px] uppercase leading-tight tracking-[0.12em] text-[var(--fass-text)] sm:text-[10px] xl:tracking-[0.16em]">
                  {metric.label}
                </p>
                <div className="mx-auto mt-3 h-12 w-12 rounded-full border-[7px] border-[var(--fass-border)]" style={{ borderTopColor: metric.color, transform: 'rotate(35deg)' }} />
                <p className="mt-2 text-lg font-semibold text-[var(--fass-text)]">{metric.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-[430px] h-full flex-col rounded-[1.75rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-[var(--fass-text)]">
          <Radar className="h-4 w-4 text-[var(--fass-blue)]" />
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--fass-blue)]">Service load</p>
        </div>

        <div className="mt-4 flex flex-1 flex-col gap-3">
          <div className="rounded-[1.2rem] bg-[var(--fass-bg-light)] px-4 py-4">
            <div className="flex items-center gap-2 text-[var(--fass-text)]">
              <Activity className="h-4 w-4 text-[var(--fass-blue)]" />
              <p className="text-sm font-medium">Issue queue</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--fass-text-muted)]">Open issues</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--fass-text)]">{stats.activeMaintenanceLogs}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--fass-text-muted)]">Blocked rooms</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--fass-text)]">{stats.roomsInMaintenance}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.2rem] bg-[var(--fass-bg-light)] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Buildings covered</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--fass-text)]">{stats.totalBuildings}</p>
            </div>
            <div className="rounded-[1.2rem] bg-[var(--fass-bg-light)] px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fass-text-muted)]">Campuses covered</p>
              <p className="mt-3 text-3xl font-semibold text-[var(--fass-text)]">{stats.totalCampuses}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
