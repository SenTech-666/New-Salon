'use client';

import { DAY_NAMES_FULL, DaySchedule } from '@/lib/scheduling';

export default function ScheduleGrid({
  schedule,
  onChange,
}: {
  schedule: DaySchedule[];
  onChange: (next: DaySchedule[]) => void;
}) {
  const update = (dayOfWeek: number, patch: Partial<DaySchedule>) => {
    onChange(
      schedule.map((d) => (d.day_of_week === dayOfWeek ? { ...d, ...patch } : d))
    );
  };

  // показываем дни в порядке Пн..Вс, а не Вс..Сб
  const ordered = [1, 2, 3, 4, 5, 6, 0]
    .map((dow) => schedule.find((d) => d.day_of_week === dow))
    .filter(Boolean) as DaySchedule[];

  return (
    <div className="space-y-2">
      {ordered.map((d) => (
        <div
          key={d.day_of_week}
          className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-slate-100 bg-white"
        >
          <div className="w-32 shrink-0">
            <p className="text-sm font-medium text-slate-900">{DAY_NAMES_FULL[d.day_of_week]}</p>
          </div>

          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={d.is_day_off}
              onChange={(e) => {
                const isDayOff = e.target.checked;
                update(d.day_of_week, {
                  is_day_off: isDayOff,
                  time_from: isDayOff ? null : d.time_from ?? '10:00',
                  time_to: isDayOff ? null : d.time_to ?? '20:00',
                });
              }}
              className="w-4 h-4 rounded accent-[#c9a08a]"
            />
            <span className="text-sm text-slate-500">Выходной</span>
          </label>

          {!d.is_day_off && (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="time"
                value={d.time_from ?? '10:00'}
                onChange={(e) => update(d.day_of_week, { time_from: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
              />
              <span className="text-slate-400 text-sm">—</span>
              <input
                type="time"
                value={d.time_to ?? '20:00'}
                onChange={(e) => update(d.day_of_week, { time_to: e.target.value })}
                className="h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
              />
            </div>
          )}

          {d.is_day_off && (
            <p className="text-sm text-slate-400 flex-1">Мастер не работает в этот день</p>
          )}
        </div>
      ))}
    </div>
  );
}