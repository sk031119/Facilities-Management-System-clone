import { Clock3, MapPin, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MaintenanceLog } from '@/types';
import { MAINTENANCE_PRIORITY_META, MAINTENANCE_STATUS_META } from '@/lib/facilities';

interface RecentMaintenanceTableProps {
  logs: (MaintenanceLog & {
    room?: { roomNumber: string; building?: { name: string } };
  })[];
}

export default function RecentMaintenanceTable({ logs }: RecentMaintenanceTableProps) {
  return (
    <Card className="rounded-[2rem] border-[var(--fass-border)] bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle style={{ fontFamily: 'var(--font-heading)' }}>Recent maintenance</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {logs.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--fass-border)] p-6 text-sm text-[var(--fass-text-muted)]">
            No active maintenance issues right now.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-[1.5rem] border border-[var(--fass-border)] p-4 transition hover:border-[var(--fass-blue)]"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--fass-text)]">{log.title}</p>
                      <p className="text-sm text-[var(--fass-text-muted)]">{log.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--fass-text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {log.room?.building?.name ?? 'Unknown building'} · {log.room?.roomNumber ?? 'No room'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {log.estimatedCompletion
                        ? `ETA ${new Date(log.estimatedCompletion).toLocaleDateString()}`
                        : 'No ETA'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={MAINTENANCE_STATUS_META[log.status].tone}>
                    {MAINTENANCE_STATUS_META[log.status].label}
                  </Badge>
                  <Badge variant="outline" className={MAINTENANCE_PRIORITY_META[log.priority].tone}>
                    {MAINTENANCE_PRIORITY_META[log.priority].label}
                  </Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
