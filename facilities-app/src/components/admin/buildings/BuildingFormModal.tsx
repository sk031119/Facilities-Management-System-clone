'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Building, CampusWithBuildings } from '@/types';

const FormSchema = z.object({
  campusId: z.string().min(1, 'Please select a campus'),
  name: z.string().min(1, 'Name required').max(100),
  buildingCode: z
    .string()
    .min(1, 'Code required')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Uppercase letters, numbers, or hyphens only'),
  mapLatitude: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(-90).max(90).optional()
  ),
  mapLongitude: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(-180).max(180).optional()
  ),
  mapLabel: z.string().max(120).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface BuildingFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  campuses: CampusWithBuildings[];
  building?: Building | null;
  defaultCampusId?: string;
};

export default function BuildingFormModal({ open, onClose, onSuccess, campuses, building, defaultCampusId }: BuildingFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const isEditing = !!building;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<
    z.input<typeof FormSchema>,
    unknown,
    FormValues
  >({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      campusId: String(building?.campusId ?? defaultCampusId ?? ''),
      name: building?.name ?? '',
      buildingCode: building?.buildingCode ?? '',
      mapLatitude: building?.mapLatitude ?? undefined,
      mapLongitude: building?.mapLongitude ?? undefined,
      mapLabel: building?.mapLabel ?? '',
    },
  });

  // Reset form whenever the modal opens or the target building/campus changes
  useEffect(() => {
    if (open) {
      reset({
        campusId: String(building?.campusId ?? defaultCampusId ?? ''),
        name: building?.name ?? '',
        buildingCode: building?.buildingCode ?? '',
        mapLatitude: building?.mapLatitude ?? undefined,
        mapLongitude: building?.mapLongitude ?? undefined,
        mapLabel: building?.mapLabel ?? '',
      });
      setServerError('');
    }
  }, [open, building, defaultCampusId, reset]);

  async function onSubmit(data: FormValues) {
    setSaving(true);
    setServerError('');
    try {
      const url = isEditing ? `/api/buildings/${building!.id}` : '/api/buildings';
      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          mapLatitude: data.mapLatitude ?? null,
          mapLongitude: data.mapLongitude ?? null,
          mapLabel: data.mapLabel?.trim() ? data.mapLabel.trim() : null,
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
            {isEditing ? 'Update building profile' : 'Add building profile'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{serverError}</p>}

          <p className="text-sm text-[var(--fass-text-muted)]">
            Use clear building names and reliable codes so room search, building selection, and indoor map navigation stay consistent.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="campusId">Campus</Label>
            <select
              id="campusId"
              {...register('campusId')}
              className="enterprise-native-select flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select campus</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.campusId && <p className="text-xs text-red-500">{errors.campusId.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Building Name</Label>
            <Input id="name" placeholder="e.g. North Building" {...register('name')} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="buildingCode">Building Code</Label>
            <Input
              id="buildingCode"
              placeholder="e.g. NX"
              className="font-mono uppercase"
              {...register('buildingCode', {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
            <p className="text-xs text-muted-foreground">Uppercase letters, numbers, and hyphens only (e.g. NX, BLDG-A)</p>
            <p className="text-xs text-[var(--fass-text-muted)]">
              Outdoor building marker and label come from the saved map values below. Indoor room navigation is generated from this building plus its mapped rooms and floors.
            </p>
            {errors.buildingCode && <p className="text-xs text-red-500">{errors.buildingCode.message}</p>}
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

          <div className="space-y-1.5">
            <Label htmlFor="mapLabel">Map Label</Label>
            <Input id="mapLabel" placeholder="North teaching wing" {...register('mapLabel')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-[var(--fass-blue)] hover:bg-[var(--fass-blue-dark)] text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Save building updates' : 'Create building profile'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
