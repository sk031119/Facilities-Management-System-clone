'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Filter,
  Pencil,
  Plus,
  Search,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  MAINTENANCE_PRIORITY_META,
  MAINTENANCE_PRIORITY_OPTIONS,
  MAINTENANCE_STATUS_META,
  MAINTENANCE_STATUS_OPTIONS,
} from '@/lib/facilities';
import MaintenanceIssueDialog from './MaintenanceIssueDialog';
import type { MaintenanceLog, Room } from '@/types';

interface Log extends MaintenanceLog {
  room?: { roomNumber: string; building?: { buildingCode: string; campus?: { id: string; name: string } } };
}

interface MaintenanceRoom extends Pick<Room, 'id' | 'roomNumber' | 'buildingId'> {
  building?: { buildingCode: string; campus?: { id: string; name: string } };
}

interface MaintenanceDataTableProps {
  logs: Log[];
  rooms: MaintenanceRoom[];
  initialStatus?: string;
  initialPriority?: string;
  initialQuery?: string;
}

export default function MaintenanceDataTable({
  logs,
  rooms,
  initialStatus,
  initialPriority,
  initialQuery,
}: MaintenanceDataTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialQuery ?? '');
  const [statusFilter, setStatusFilter] = useState(initialStatus ?? 'all');
  const [priorityFilter, setPriorityFilter] = useState(initialPriority ?? 'all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editLog, setEditLog] = useState<Log | null>(null);
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(() => {
    const normalized = deferredSearch.trim().toLowerCase();

    return logs.filter((log) => {
      const searchMatch =
        normalized.length === 0 ||
        log.title.toLowerCase().includes(normalized) ||
        log.description.toLowerCase().includes(normalized) ||
        (log.room?.roomNumber ?? '').toLowerCase().includes(normalized) ||
        (log.room?.building?.buildingCode ?? '').toLowerCase().includes(normalized);

      const statusMatch = statusFilter === 'all' || log.status === statusFilter;
      const priorityMatch = priorityFilter === 'all' || log.priority === priorityFilter;
      return searchMatch && statusMatch && priorityMatch;
    });
  }, [deferredSearch, logs, priorityFilter, statusFilter]);

  function refresh() {
    router.refresh();
    setCreateOpen(false);
    setEditLog(null);
  }

  async function resolveLog(log: Log) {
    if (!confirm('Resolve this maintenance issue and return the room to service if no other active issues remain?')) {
      return;
    }

    await fetch(`/api/rooms/${log.roomId}/maintenance/${log.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'RESOLVED',
        isActive: false,
      }),
    });

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.9rem] border border-[var(--fass-border)] bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--fass-blue)]" />
              <p className="text-xl font-semibold text-[var(--fass-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Service desk
              </p>
            </div>

            <Button
              className="h-10 gap-2 rounded-full px-4 text-white"
              style={{ backgroundColor: 'var(--fass-blue)' }}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Report issue
            </Button>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(280px,1.25fr)_minmax(180px,0.78fr)_minmax(180px,0.78fr)_auto] xl:items-center">
            <div className="relative min-w-0 xl:min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fass-text-muted)]" />
              <Input
                className="h-10 rounded-xl border-[var(--fass-border)] pl-9"
                placeholder="Search room, issue title, or note"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="enterprise-native-select h-10 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)] outline-none"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                {MAINTENANCE_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
            </div>

            <div className="relative">
              <select
                className="enterprise-native-select h-10 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)] outline-none"
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
              >
                <option value="all">All priorities</option>
                {MAINTENANCE_PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
              <ArrowRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[var(--fass-text-muted)]" />
            </div>

            <Badge variant="outline" className="rounded-full px-3 py-1">
              {filtered.length} visible
            </Badge>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--fass-border)] bg-white shadow-sm">
        <div className="overflow-x-auto px-6 py-4 lg:px-7">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Est. completion</TableHead>
                <TableHead>Reported by</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-[var(--fass-text-muted)]">
                    No maintenance logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="max-w-sm">
                      <div className="space-y-1">
                        <p className="font-semibold text-[var(--fass-text)]">{log.title}</p>
                        <p className="line-clamp-2 text-sm text-[var(--fass-text-muted)]">
                          {log.description}
                        </p>
                        {log.resolutionNotes ? (
                          <p className="text-xs text-[var(--fass-text-muted)]">
                            Resolution: {log.resolutionNotes}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--fass-text-muted)]">
                      <p className="font-medium text-[var(--fass-text)]">
                        {log.room?.roomNumber ?? '—'}
                      </p>
                      <p>{log.room?.building?.buildingCode ?? 'Unknown building'}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={MAINTENANCE_PRIORITY_META[log.priority].tone}
                      >
                        {MAINTENANCE_PRIORITY_META[log.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={MAINTENANCE_STATUS_META[log.status].tone}>
                        {log.status === 'RESOLVED' ? (
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        ) : log.status === 'IN_PROGRESS' ? (
                          <Wrench className="mr-1 h-3.5 w-3.5" />
                        ) : (
                          <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                        )}
                        {MAINTENANCE_STATUS_META[log.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--fass-text-muted)]">
                      {log.estimatedCompletion
                        ? new Date(log.estimatedCompletion).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--fass-text-muted)]">
                      {log.createdBy?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditLog(log)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {log.status !== 'RESOLVED' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => resolveLog(log)}
                          >
                            Resolve
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <MaintenanceIssueDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
        rooms={rooms}
      />
      <MaintenanceIssueDialog
        open={Boolean(editLog)}
        onClose={() => setEditLog(null)}
        onSuccess={refresh}
        rooms={rooms}
        log={editLog}
      />
    </div>
  );
}
