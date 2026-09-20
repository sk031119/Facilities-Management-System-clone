'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar } from 'lucide-react';
import type { SchedulerTimetable, SchedulerTimeslot } from '@/types';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface TimetableViewProps {
  timetable: SchedulerTimetable;
}

function groupByDay(slots: SchedulerTimeslot[]): Record<string, SchedulerTimeslot[]> {
  return slots.reduce<Record<string, SchedulerTimeslot[]>>((acc, slot) => {
    if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {});
}

export default function TimetableView({ timetable }: TimetableViewProps) {
  const byDay = groupByDay(timetable.slots);
  const daysWithSlots = DAY_ORDER.filter((d) => byDay[d]);

  return (
    <Card className="border-[var(--fass-border)] bg-white h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-semibold text-[var(--fass-text)] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Calendar className="w-4 h-4 text-[var(--fass-blue)]" />
            Weekly Timetable
          </CardTitle>
          {timetable.isFallback && (
            <Badge variant="secondary" className="text-xs gap-1 text-amber-700 bg-amber-50 border-amber-200">
              <AlertTriangle className="w-3 h-3" />
              Scheduler unavailable — showing empty schedule
            </Badge>
          )}
        </div>
        <p className="text-xs text-[var(--fass-text-muted)] mt-1">
          Last updated: {new Date(timetable.fetchedAt).toLocaleTimeString()}
        </p>
      </CardHeader>
      <CardContent>
        {timetable.slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-10 h-10 text-[var(--fass-border)] mb-3" />
            <p className="text-sm font-medium text-[var(--fass-text-muted)]">No scheduled classes</p>
            <p className="text-xs text-[var(--fass-text-muted)] mt-1">
              {timetable.isFallback
                ? 'Could not reach the Scheduler API. This room may have active bookings.'
                : 'This room has no bookings in the current schedule.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {daysWithSlots.map((day) => (
              <div key={day}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--fass-text-muted)] mb-2">
                  {day}
                </h3>
                <div className="space-y-2">
                  {byDay[day]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-[var(--fass-bg-light)] border border-[var(--fass-border)]"
                      >
                        <div className="shrink-0 text-center">
                          <p className="text-xs font-semibold text-[var(--fass-blue)]">{slot.startTime}</p>
                          <p className="text-[10px] text-[var(--fass-text-muted)]">to</p>
                          <p className="text-xs font-semibold text-[var(--fass-blue)]">{slot.endTime}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--fass-text)] truncate">{slot.courseName}</p>
                          <p className="text-xs text-[var(--fass-text-muted)]">{slot.courseCode} — {slot.instructor}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
