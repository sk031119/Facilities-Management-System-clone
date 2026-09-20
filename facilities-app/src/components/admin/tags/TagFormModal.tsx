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
import type { Tag } from '@/types';

const FormSchema = z.object({
  tagName: z
    .string()
    .min(1, 'Tag name required')
    .max(50)
    .regex(/^#?[\w]+$/, 'Letters, numbers, and underscores only'),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
});

type FormValues = z.infer<typeof FormSchema>;

interface TagFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tag?: Tag | null;
}

export default function TagFormModal({ open, onClose, onSuccess, tag }: TagFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');

  const isEditing = !!tag;

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tagName: tag?.tagName ?? '',
      colorCode: tag?.colorCode ?? '#007ACC',
    },
  });

  // Reset form whenever the modal opens or the target tag changes
  useEffect(() => {
    if (open) {
      reset({
        tagName: tag?.tagName ?? '',
        colorCode: tag?.colorCode ?? '#007ACC',
      });
      setServerError('');
    }
  }, [open, tag, reset]);

  const colorValue = watch('colorCode');

  async function onSubmit(data: FormValues) {
    setSaving(true);
    setServerError('');
    try {
      const url = isEditing ? `/api/tags/${tag!.id}` : '/api/tags';
      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>
            {isEditing ? 'Edit Tag' : 'Add Tag'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{serverError}</p>}

          <div className="space-y-1.5">
            <Label htmlFor="tagName">Tag Name</Label>
            <Input id="tagName" placeholder="e.g. projector" {...register('tagName')} />
            {errors.tagName && <p className="text-xs text-red-500">{errors.tagName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="colorCode">Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="colorCode"
                {...register('colorCode')}
                className="w-10 h-9 rounded border border-[var(--fass-border)] cursor-pointer p-0.5"
              />
              <Input
                {...register('colorCode')}
                placeholder="#007ACC"
                className="font-mono flex-1"
              />
            </div>
            {errors.colorCode && <p className="text-xs text-red-500">{errors.colorCode.message}</p>}
            <div
              className="flex items-center gap-2 px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: `${colorValue}18`, color: colorValue }}
            >
              Preview: {watch('tagName') || 'tag-name'}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-[var(--fass-blue)] hover:bg-[var(--fass-blue-dark)] text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Tag'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
