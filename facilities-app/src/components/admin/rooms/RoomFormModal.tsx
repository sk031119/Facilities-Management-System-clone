'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Badge } from '@/components/ui/badge';
import { ROOM_STATUS_OPTIONS, ROOM_TYPE_OPTIONS } from '@/lib/facilities';
import type { Building, Room, Tag } from '@/types';

const FormSchema = z.object({
  buildingId: z.string().min(1, 'Please select a building'),
  roomNumber: z.string().min(1, 'Room number is required').max(20),
  floor: z.number().int().min(0).max(99),
  capacity: z.number().int().min(1).max(2000),
  roomType: z.enum(['CLASSROOM', 'LAB', 'LECTURE_HALL', 'OFFICE', 'COMMON_AREA', 'GYM', 'OTHER']),
  currentStatus: z.enum(['AVAILABLE', 'OCCUPIED', 'MAINTENANCE']),
  description: z.string().max(500).optional(),
  tagIds: z.array(z.string()),
});

type FormValues = z.infer<typeof FormSchema>;

interface RoomFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  buildings: Building[];
  tags: Tag[];
  room?: Room | null;
}

const selectClass =
  'enterprise-native-select flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

export default function RoomFormModal({
  open,
  onClose,
  onSuccess,
  buildings,
  tags,
  room,
}: RoomFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [availableTags, setAvailableTags] = useState(tags);
  const [creatingTag, setCreatingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState({ tagName: '', colorCode: '#007ACC' });
  const [tagError, setTagError] = useState('');

  const isEditing = Boolean(room);

  const sortedBuildings = useMemo(
    () =>
      [...buildings].sort((left, right) => {
        const leftCampus = left.campus?.name ?? '';
        const rightCampus = right.campus?.name ?? '';
        if (leftCampus !== rightCampus) return leftCampus.localeCompare(rightCampus);
        return left.buildingCode.localeCompare(right.buildingCode);
      }),
    [buildings]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      buildingId: room?.buildingId ?? '',
      roomNumber: room?.roomNumber ?? '',
      floor: room?.floor ?? 0,
      capacity: room?.capacity ?? 30,
      roomType: room?.roomType ?? 'CLASSROOM',
      currentStatus: room?.currentStatus ?? 'AVAILABLE',
      description: room?.description ?? '',
      tagIds: room?.tags?.map((tag) => tag.id) ?? [],
    },
  });

  const selectedTagIds = watch('tagIds');

  useEffect(() => {
    if (!open) return;

    setAvailableTags(tags);
    reset({
      buildingId: room?.buildingId ?? '',
      roomNumber: room?.roomNumber ?? '',
      floor: room?.floor ?? 0,
      capacity: room?.capacity ?? 30,
      roomType: room?.roomType ?? 'CLASSROOM',
      currentStatus: room?.currentStatus ?? 'AVAILABLE',
      description: room?.description ?? '',
      tagIds: room?.tags?.map((tag) => tag.id) ?? [],
    });
    setServerError('');
    setTagDraft({ tagName: '', colorCode: '#007ACC' });
    setTagError('');
  }, [open, reset, room, tags]);

  function toggleTag(tagId: string) {
    const nextValue = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((currentId) => currentId !== tagId)
      : [...selectedTagIds, tagId];
    setValue('tagIds', nextValue, { shouldDirty: true, shouldTouch: true });
  }

  async function createTagInline() {
    const normalizedName = tagDraft.tagName.trim().replace(/\s+/g, '_');
    if (!normalizedName) {
      setTagError('Tag name is required.');
      return;
    }

    setCreatingTag(true);
    setTagError('');

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagName: normalizedName.startsWith('#') ? normalizedName : `#${normalizedName}`,
          colorCode: tagDraft.colorCode,
        }),
      });

      const body = (await response.json()) as { data?: Tag; error?: string; details?: Record<string, string[]> };
      if (!response.ok || !body.data) {
        setTagError(body.error ?? body.details?.tagName?.[0] ?? 'Unable to create tag.');
        return;
      }

      setAvailableTags((current) =>
        [...current, body.data as Tag].sort((left, right) => left.tagName.localeCompare(right.tagName))
      );
      setValue('tagIds', [...selectedTagIds, body.data.id], { shouldDirty: true, shouldTouch: true });
      setTagDraft({ tagName: '', colorCode: tagDraft.colorCode });
    } finally {
      setCreatingTag(false);
    }
  }

  async function onSubmit(data: FormValues) {
    setSaving(true);
    setServerError('');

    try {
      const url = isEditing ? `/api/rooms/${room!.id}` : '/api/rooms';
      const method = isEditing ? 'PATCH' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          description: data.description?.trim() ? data.description.trim() : undefined,
        }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setServerError(body.error ?? 'Something went wrong');
        return;
      }

      reset();
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
            {isEditing ? 'Edit room' : 'Create room'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {serverError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="buildingId">Building</Label>
              <select id="buildingId" {...register('buildingId')} className={selectClass}>
                <option value="">Select a building</option>
                {sortedBuildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.campus?.name ?? 'Campus'} · {building.buildingCode} · {building.name}
                  </option>
                ))}
              </select>
              {errors.buildingId ? (
                <p className="text-xs text-red-500">{errors.buildingId.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roomNumber">Room number</Label>
              <Input id="roomNumber" placeholder="e.g. H205" {...register('roomNumber')} />
              {errors.roomNumber ? (
                <p className="text-xs text-red-500">{errors.roomNumber.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="roomType">Room type</Label>
              <select id="roomType" {...register('roomType')} className={selectClass}>
                {ROOM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                type="number"
                min={0}
                {...register('floor', { valueAsNumber: true })}
              />
              {errors.floor ? <p className="text-xs text-red-500">{errors.floor.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                {...register('capacity', { valueAsNumber: true })}
              />
              {errors.capacity ? (
                <p className="text-xs text-red-500">{errors.capacity.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="currentStatus">Current status</Label>
              <select id="currentStatus" {...register('currentStatus')} className={selectClass}>
                {ROOM_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe room usage, layout, accessibility notes, or special requirements."
                rows={4}
                {...register('description')}
              />
              {errors.description ? (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Feature tags</Label>
                <p className="text-xs text-[var(--fass-text-muted)]">
                  {selectedTagIds.length} selected
                </p>
              </div>
              <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--fass-border)] bg-[color:color-mix(in_srgb,var(--fass-bg-white)_88%,transparent)] p-3">
                {availableTags.length === 0 ? (
                  <p className="text-sm text-[var(--fass-text-muted)]">
                    Create tags first to make rooms filterable across the module.
                  </p>
                ) : (
                  availableTags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full border px-3 py-1.5 text-sm transition ${selected
                            ? 'border-transparent text-white shadow-sm'
                            : 'border-[var(--fass-border)] text-[var(--fass-text-muted)] hover:border-[var(--fass-blue)]'
                          }`}
                        style={
                          selected
                            ? {
                              backgroundColor: tag.colorCode,
                            }
                            : undefined
                        }
                      >
                        {tag.tagName}
                      </button>
                    );
                  })
                )}
              </div>
              <div className="grid gap-3 rounded-2xl border border-dashed border-[var(--fass-border)] p-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
                <Input
                  placeholder="Create a new label, e.g. #ComputerLab"
                  value={tagDraft.tagName}
                  onChange={(event) => setTagDraft((current) => ({ ...current, tagName: event.target.value }))}
                />
                <Input
                  type="color"
                  value={tagDraft.colorCode}
                  onChange={(event) => setTagDraft((current) => ({ ...current, colorCode: event.target.value }))}
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={creatingTag}
                  onClick={createTagInline}
                >
                  {creatingTag ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add label
                </Button>
              </div>
              {tagError ? <p className="text-xs text-red-500">{tagError}</p> : null}
              {selectedTagIds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags
                    .filter((tag) => selectedTagIds.includes(tag.id))
                    .map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        style={{
                          backgroundColor: `${tag.colorCode}22`,
                          color: tag.colorCode,
                          borderColor: `${tag.colorCode}33`,
                        }}
                      >
                        {tag.tagName}
                      </Badge>
                    ))}
                </div>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[var(--fass-blue)] text-white hover:bg-[var(--fass-blue-dark)]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Save changes' : 'Create room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
