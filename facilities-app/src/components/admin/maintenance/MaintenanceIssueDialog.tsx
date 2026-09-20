'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  MAINTENANCE_PRIORITY_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
} from '@/lib/facilities';
import type { MaintenanceLog, Room } from '@/types';

interface MaintenanceRoomOption extends Pick<Room, 'id' | 'roomNumber'> {
  building?: { buildingCode: string; campus?: { id: string; name: string } };
  buildingId?: string;
}

interface MaintenanceIssueDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rooms: MaintenanceRoomOption[];
  log?: (Omit<MaintenanceLog, 'room'> & {
    room?: { roomNumber: string; building?: { buildingCode: string; campus?: { id: string; name: string } } };
  }) | null;
}

interface FormState {
  roomId: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  estimatedCompletion: string;
  resolutionNotes: string;
}

function toDatetimeLocal(value?: Date | string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export default function MaintenanceIssueDialog({
  open,
  onClose,
  onSuccess,
  rooms,
  log,
}: MaintenanceIssueDialogProps) {
  const [form, setForm] = useState<FormState>({
    roomId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'OPEN',
    estimatedCompletion: '',
    resolutionNotes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [campusId, setCampusId] = useState('');

  const isEditing = Boolean(log);

  const campusOptions = useMemo(() => {
    const campuses = new Map<string, string>();

    rooms.forEach((room) => {
      const campus = room.building?.campus;
      if (campus?.id && campus.name) {
        campuses.set(campus.id, campus.name);
      }
    });

    return Array.from(campuses.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [rooms]);

  const filteredRooms = useMemo(
    () => rooms.filter((room) => !campusId || room.building?.campus?.id === campusId),
    [campusId, rooms]
  );

  const sortedRooms = useMemo(
    () =>
      [...filteredRooms].sort((left, right) => {
        const leftLabel = `${left.building?.buildingCode ?? ''}${left.roomNumber}`;
        const rightLabel = `${right.building?.buildingCode ?? ''}${right.roomNumber}`;
        return leftLabel.localeCompare(rightLabel);
      }),
    [filteredRooms]
  );

  useEffect(() => {
    if (!open) return;

    setForm({
      roomId: log?.roomId ?? '',
      title: log?.title ?? '',
      description: log?.description ?? '',
      priority: log?.priority ?? 'MEDIUM',
      status: log?.status ?? 'OPEN',
      estimatedCompletion: toDatetimeLocal(log?.estimatedCompletion),
      resolutionNotes: log?.resolutionNotes ?? '',
    });
    setCampusId(log?.room?.building?.campus?.id ?? '');
    setError('');
  }, [log, open]);

  async function submit() {
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }

    if (!isEditing && !form.roomId) {
      setError('Please select a room.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = isEditing
        ? `/api/rooms/${log!.roomId}/maintenance/${log!.id}`
        : `/api/rooms/${form.roomId}/maintenance`;

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.status,
        estimatedCompletion: form.estimatedCompletion
          ? new Date(form.estimatedCompletion).toISOString()
          : undefined,
        resolutionNotes: form.resolutionNotes.trim() || undefined,
        isActive: form.status !== 'RESOLVED',
      };

      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? 'Unable to save maintenance issue.');
        return;
      }

      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="border-[var(--fass-border)] bg-[var(--fass-bg-white)] text-[var(--fass-text)] sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
            {isEditing ? 'Update maintenance issue' : 'Report maintenance issue'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {!isEditing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="maintenance-campus">Campus</Label>
                <select
                  id="maintenance-campus"
                  className="enterprise-native-select flex h-11 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)]"
                  value={campusId}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCampusId(value);
                    setForm((current) => ({ ...current, roomId: '' }));
                  }}
                >
                  <option value="">All campuses</option>
                  {campusOptions.map((campus) => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maintenance-room">Room</Label>
                <select
                  id="maintenance-room"
                  className="enterprise-native-select flex h-11 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)]"
                  value={form.roomId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, roomId: event.target.value }))
                  }
                >
                  <option value="">
                    {campusId ? 'Select a room' : 'Select a campus first or browse all rooms'}
                  </option>
                  {sortedRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.building?.campus?.name ?? 'Campus'} · {room.building?.buildingCode ?? 'BLDG'} · {room.roomNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="maintenance-title">Issue title</Label>
              <Input
                id="maintenance-title"
                placeholder="Projector outage, HVAC problem, seating damage..."
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maintenance-priority">Priority</Label>
              <select
                id="maintenance-priority"
                className="enterprise-native-select flex h-11 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)]"
                value={form.priority}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priority: event.target.value as FormState['priority'],
                  }))
                }
              >
                {MAINTENANCE_PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maintenance-status">Status</Label>
              <select
                id="maintenance-status"
                className="enterprise-native-select flex h-11 w-full rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-white)] px-3 pr-10 text-sm text-[var(--fass-text)]"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as FormState['status'],
                  }))
                }
              >
                {MAINTENANCE_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="maintenance-description">Description</Label>
              <Textarea
                id="maintenance-description"
                rows={4}
                placeholder="What is broken, what is blocked, and what should staff know before entering the room?"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maintenance-estimate">Estimated completion</Label>
              <Input
                id="maintenance-estimate"
                type="datetime-local"
                value={form.estimatedCompletion}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    estimatedCompletion: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="maintenance-resolution">Resolution notes</Label>
              <Textarea
                id="maintenance-resolution"
                rows={3}
                placeholder="Parts replaced, workaround used, follow-up required..."
                value={form.resolutionNotes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    resolutionNotes: event.target.value,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={saving}
            onClick={submit}
            className="bg-[var(--fass-blue)] text-white hover:bg-[var(--fass-blue-dark)]"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditing ? 'Save issue' : 'Create issue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
