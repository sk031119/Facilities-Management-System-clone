'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Asset, Room } from '@/types';

interface RoomAssetsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  room: Room | null;
}

interface AssetDraft {
  itemName: string;
  quantity: number;
  isFunctional: boolean;
}

const EMPTY_DRAFT: AssetDraft = {
  itemName: '',
  quantity: 1,
  isFunctional: true,
};

export default function RoomAssetsDialog({
  open,
  onClose,
  onSuccess,
  room,
}: RoomAssetsDialogProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [draft, setDraft] = useState<AssetDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !room) return;
    setAssets(room.assets ?? []);
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setError('');
  }, [open, room]);

  const dialogTitle = useMemo(() => {
    if (!room) return 'Room assets';
    return `Assets for room ${room.roomNumber}`;
  }, [room]);

  async function submitDraft() {
    if (!room) return;
    if (!draft.itemName.trim()) {
      setError('Asset name is required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(
        editingId
          ? `/api/rooms/${room.id}/assets/${editingId}`
          : `/api/rooms/${room.id}/assets`,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemName: draft.itemName.trim(),
            quantity: draft.quantity,
            isFunctional: draft.isFunctional,
          }),
        }
      );

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? 'Unable to save asset.');
        return;
      }

      const body = (await response.json()) as { data: Asset };
      const nextAsset = body.data;
      setAssets((current) =>
        editingId
          ? current.map((asset) => (asset.id === editingId ? nextAsset : asset))
          : [...current, nextAsset].sort((left, right) => left.itemName.localeCompare(right.itemName))
      );
      setDraft(EMPTY_DRAFT);
      setEditingId(null);
      onSuccess();
    } finally {
      setSaving(false);
    }
  }

  async function deleteAsset(assetId: string) {
    if (!room) return;
    if (!confirm('Delete this asset from the room?')) return;

    const response = await fetch(`/api/rooms/${room.id}/assets/${assetId}`, { method: 'DELETE' });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setError(body.error ?? 'Unable to delete asset.');
      return;
    }

    setAssets((current) => current.filter((asset) => asset.id !== assetId));
    onSuccess();
  }

  function editAsset(asset: Asset) {
    setEditingId(asset.id);
    setDraft({
      itemName: asset.itemName,
      quantity: asset.quantity,
      isFunctional: asset.isFunctional,
    });
    setError('');
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'var(--font-heading)' }}>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Add room equipment, mark broken items, and keep room inventories aligned with the
            scheduling module.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--fass-border)] bg-white">
              <div className="flex items-center justify-between border-b border-[var(--fass-border)] px-4 py-3">
                <div>
                  <h3 className="font-semibold text-[var(--fass-text)]">Current inventory</h3>
                  <p className="text-sm text-[var(--fass-text-muted)]">
                    {assets.length} assets tracked
                  </p>
                </div>
              </div>
              <div className="divide-y divide-[var(--fass-border)]">
                {assets.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-[var(--fass-text-muted)]">
                    No assets recorded yet for this room.
                  </p>
                ) : (
                  assets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--fass-text)]">{asset.itemName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">Qty {asset.quantity}</Badge>
                          <Badge
                            variant="outline"
                            className={
                              asset.isFunctional
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-amber-200 bg-amber-50 text-amber-700'
                            }
                          >
                            {asset.isFunctional ? 'Functional' : 'Needs attention'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => editAsset(asset)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => deleteAsset(asset.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--fass-border)] bg-[color:color-mix(in_srgb,var(--fass-bg-white)_88%,transparent)] p-4">
            <div>
              <h3 className="font-semibold text-[var(--fass-text)]">
                {editingId ? 'Edit asset' : 'Add asset'}
              </h3>
              <p className="text-sm text-[var(--fass-text-muted)]">
                This data also powers room detail views and future facility planning.
              </p>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="asset-name">Asset name</Label>
              <Input
                id="asset-name"
                placeholder="Projector, movable desks, smart board..."
                value={draft.itemName}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, itemName: event.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="asset-quantity">Quantity</Label>
              <Input
                id="asset-quantity"
                type="number"
                min={1}
                value={draft.quantity}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    quantity: Number(event.target.value || 1),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Condition</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={draft.isFunctional ? 'default' : 'outline'}
                  className={draft.isFunctional ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                  onClick={() => setDraft((current) => ({ ...current, isFunctional: true }))}
                >
                  Functional
                </Button>
                <Button
                  type="button"
                  variant={!draft.isFunctional ? 'default' : 'outline'}
                  className={!draft.isFunctional ? 'bg-amber-500 text-white hover:bg-amber-600' : ''}
                  onClick={() => setDraft((current) => ({ ...current, isFunctional: false }))}
                >
                  Needs repair
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={submitDraft}
                disabled={saving}
                className="bg-[var(--fass-blue)] text-white hover:bg-[var(--fass-blue-dark)]"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? 'Update asset' : 'Add asset'}
              </Button>
              {editingId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setDraft(EMPTY_DRAFT);
                    setError('');
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
