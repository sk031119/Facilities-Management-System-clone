import type { RoomStatusSummary } from '@/types';

interface CampusStatusBreakdownProps {
  summary: RoomStatusSummary[];
}

export default function CampusStatusBreakdown({ summary }: CampusStatusBreakdownProps) {
  if (summary.length === 0) return null;

  return (
    <section className="rounded-[1.75rem] border border-[var(--fass-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className="text-xl font-semibold text-[var(--fass-text)]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Campus summary
          </h2>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {summary.map((campus) => {
          const total = Math.max(campus.total, 1);

          return (
            <div
              key={campus.campusId}
              className="rounded-[1.4rem] border border-[var(--fass-border)] bg-[var(--fass-bg-light)] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--fass-text)]">{campus.campusName}</p>
                  <p className="text-sm text-[var(--fass-text-muted)]">{campus.total} rooms</p>
                </div>
                <span className="rounded-full bg-[var(--fass-bg-white)] px-2.5 py-1 text-xs text-[var(--fass-text-muted)]">
                  {Math.round((campus.available / total) * 100)}% ready
                </span>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--fass-bg-white)]">
                <div className="flex h-full">
                  <div style={{ width: `${(campus.available / total) * 100}%`, backgroundColor: 'var(--status-available)' }} />
                  <div style={{ width: `${(campus.occupied / total) * 100}%`, backgroundColor: 'var(--status-occupied)' }} />
                  <div style={{ width: `${(campus.maintenance / total) * 100}%`, backgroundColor: 'var(--fass-yellow)' }} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--status-available)' }}>{campus.available}</p>
                  <p className="text-[var(--fass-text-muted)]">Ready</p>
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--status-occupied)' }}>{campus.occupied}</p>
                  <p className="text-[var(--fass-text-muted)]">Occupied</p>
                </div>
                <div>
                  <p className="font-semibold" style={{ color: 'var(--fass-yellow)' }}>{campus.maintenance}</p>
                  <p className="text-[var(--fass-text-muted)]">Service</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
