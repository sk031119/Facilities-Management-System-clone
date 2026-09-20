'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Room } from '@/types';

interface DeleteRoomDialogProps {
  room: Room | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteRoomDialog({ room, onClose, onSuccess }: DeleteRoomDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!room) return;
    setLoading(true);
    await fetch(`/api/rooms/${room.id}`, { method: 'DELETE' });
    setLoading(false);
    onSuccess();
  }

  return (
    <AlertDialog open={!!room} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Room {room?.roomNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the room and all its assets, tags, and maintenance logs. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
