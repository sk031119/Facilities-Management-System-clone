import type { RoomStatus } from '@/types';

interface RoomStatusBadgeProps {
  status: RoomStatus;
  showDot?: boolean;
}

const statusConfig: Record<RoomStatus, { label: string; dot: string; bg: string; text: string }> = {
  AVAILABLE: {
    label: 'Available',
    dot: 'bg-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
  },
  OCCUPIED: {
    label: 'Occupied',
    dot: 'bg-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
};

export default function RoomStatusBadge({ status, showDot = true }: RoomStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {config.label}
    </span>
  );
}
