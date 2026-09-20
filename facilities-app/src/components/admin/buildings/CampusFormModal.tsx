'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FormSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  address: z.string().min(1, 'Address required').max(255),
  timezone: z.string().min(1).max(50).optional(),
  mapLatitude: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(-90).max(90).optional()
  ),
  mapLongitude: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(-180).max(180).optional()
  ),
  mapZoom: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().int().min(13).max(19).optional()
  ),
  mapLocationLabel: z.string().max(120).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface CampusFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campus?: {
    id: string;
    name: string;
    address: string;
    timezone: string;
    mapLatitude?: number | null;
    mapLongitude?: number | null;
    mapZoom?: number | null;
    mapLocationLabel?: string | null;
  } | null;
}

interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function CampusFormModal({ open, onClose, onSuccess, campus }: CampusFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const isEditing = !!campus;

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<
    z.input<typeof FormSchema>,
    unknown,
    FormValues
  >({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: campus?.name ?? '',
      address: campus?.address ?? '',
      timezone: campus?.timezone ?? 'America/Toronto',
      mapLatitude: campus?.mapLatitude ?? undefined,
      mapLongitude: campus?.mapLongitude ?? undefined,
      mapZoom: campus?.mapZoom ?? 16,
      mapLocationLabel: campus?.mapLocationLabel ?? '',
    },
  });

  const addressValue = watch('address');

  // Reset form whenever the modal opens or the target campus changes
  useEffect(() => {
    if (open) {
      reset({
        name: campus?.name ?? '',
        address: campus?.address ?? '',
        timezone: campus?.timezone ?? 'America/Toronto',
        mapLatitude: campus?.mapLatitude ?? undefined,
        mapLongitude: campus?.mapLongitude ?? undefined,
        mapZoom: campus?.mapZoom ?? 16,
        mapLocationLabel: campus?.mapLocationLabel ?? '',
      });
      setServerError('');
      setSuggestions([]);
    }
  }, [open, campus, reset]);

  useEffect(() => {
    if (!open) return;

    const query = addressValue?.trim() ?? '';
    if (query.length < 5) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ca&limit=5&q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = (await response.json()) as AddressSuggestion[];
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [addressValue, open]);

  async function onSubmit(data: FormValues) {
    setSaving(true);
    setServerError('');
    try {
      const url = isEditing ? `/api/campuses/${campus!.id}` : '/api/campuses';
      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          address: data.address,
          timezone: data.timezone ?? campus?.timezone ?? 'America/Toronto',
          mapLatitude: data.mapLatitude ?? null,
          mapLongitude: data.mapLongitude ?? null,
          mapZoom: data.mapZoom ?? null,
          mapLocationLabel: data.mapLocationLabel?.trim() ? data.mapLocationLabel.trim() : null,
        }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setServerError(body.error ?? 'Something went wrong');
      } else {
        reset();
        onSuccess();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
            {isEditing ? 'Update campus profile' : 'Create campus profile'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{serverError}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="name">Campus Name</Label>
            <Input id="name" placeholder="e.g. North Campus" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <Input id="address" placeholder="e.g. 205 FASS College Blvd, Toronto, ON" {...register('address')} />
              {loadingSuggestions ? (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--fass-text-muted)]" />
              ) : null}
            </div>
            {suggestions.length > 0 ? (
              <div className="rounded-xl border border-[var(--fass-border)] bg-[var(--fass-bg-light)] p-2">
                <p className="px-2 pb-1 text-xs text-[var(--fass-text-muted)]">Suggested addresses</p>
                <div className="space-y-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--fass-text)] transition hover:bg-[var(--fass-bg-white)]"
                      onClick={() => {
                        setValue('address', suggestion.display_name, { shouldDirty: true, shouldValidate: true });
                        setValue('mapLatitude', Number.parseFloat(suggestion.lat), { shouldDirty: true, shouldValidate: true });
                        setValue('mapLongitude', Number.parseFloat(suggestion.lon), { shouldDirty: true, shouldValidate: true });
                        setSuggestions([]);
                      }}
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--fass-blue)]" />
                      <span>{suggestion.display_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="text-xs text-[var(--fass-text-muted)]">
              Selecting a suggestion fills the address and its latitude/longitude. Those values are then used for campus map placement, location search, and room navigation context.
            </p>
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mapLatitude">Map Latitude</Label>
              <Input id="mapLatitude" placeholder="43.7289" type="number" step="0.000001" {...register('mapLatitude')} />
              {errors.mapLatitude && <p className="text-xs text-red-500">{errors.mapLatitude.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mapLongitude">Map Longitude</Label>
              <Input id="mapLongitude" placeholder="-79.6073" type="number" step="0.000001" {...register('mapLongitude')} />
              {errors.mapLongitude && <p className="text-xs text-red-500">{errors.mapLongitude.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
            <div className="space-y-1.5">
              <Label htmlFor="mapLocationLabel">Map Label</Label>
              <Input id="mapLocationLabel" placeholder="Toronto, CA" {...register('mapLocationLabel')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mapZoom">Map Zoom</Label>
              <Input id="mapZoom" placeholder="16" type="number" min="13" max="19" {...register('mapZoom')} />
              {errors.mapZoom && <p className="text-xs text-red-500">{errors.mapZoom.message}</p>}
            </div>
          </div>

          <p className="text-xs text-[var(--fass-text-muted)]">
            Outdoor campus map center and zoom come from these saved values. If you leave latitude and longitude empty, the map falls back to the address template.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-[var(--fass-blue)] hover:bg-[var(--fass-blue-dark)] text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Save campus updates' : 'Create campus profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
