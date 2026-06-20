import { CalendarDays } from 'lucide-react';

export default function WeekdayHeatmap({
  labels,
  counts,
}: {
  labels: string[];
  counts: number[];
}) {
  const max = Math.max(...counts, 1);
  const busiestIdx = counts.indexOf(max);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6">
      <h2 className="font-semibold text-slate-900 mb-1">Загруженность по дням</h2>
      <p className="text-sm text-slate-400 mb-6">Записи по дням недели</p>

      <div className="space-y-3">
        {labels.map((label, i) => {
          const intensity = counts[i] / max; // 0..1
          const isBusiest = i === busiestIdx && counts[i] > 0;
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500 w-6">{label}</span>
              <div className="flex-1 h-8 bg-slate-50 rounded-xl overflow-hidden relative">
                <div
                  className="h-full rounded-xl transition-all flex items-center justify-end px-2"
                  style={{
                    width: `${Math.max(intensity * 100, counts[i] > 0 ? 12 : 0)}%`,
                    backgroundColor: isBusiest
                      ? '#c9a08a'
                      : `rgba(201, 160, 138, ${0.25 + intensity * 0.45})`,
                  }}
                >
                  {counts[i] > 0 && (
                    <span
                      className={`text-xs font-semibold ${
                        intensity > 0.3 ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      {counts[i]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {counts[busiestIdx] > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays className="w-4 h-4 text-[#c9a08a]" />
          Самый загруженный день — <span className="font-medium text-slate-700">{labels[busiestIdx]}</span>
        </div>
      )}
    </div>
  );
}