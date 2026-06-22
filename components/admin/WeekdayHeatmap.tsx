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
    <div className="bg-card rounded-3xl border border-border p-6">
      <h2 className="font-semibold text-card-foreground mb-1">Загруженность по дням</h2>
      <p className="text-sm text-muted-foreground mb-6">Записи по дням недели</p>

      <div className="space-y-3">
        {labels.map((label, i) => {
          const intensity = counts[i] / max; // 0..1
          const isBusiest = i === busiestIdx && counts[i] > 0;
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground w-6">{label}</span>
              <div className="flex-1 h-8 bg-muted rounded-xl overflow-hidden relative">
                <div
                  className="h-full rounded-xl transition-all flex items-center justify-end px-2"
                  style={{
                    width: `${Math.max(intensity * 100, counts[i] > 0 ? 12 : 0)}%`,
                    // Интенсивность — динамическое значение (0..1), поэтому
                    // остаётся инлайн-стилем, но привязано к --primary
                    // токену темы через color-mix, а не к хардкод hex —
                    // меняется вместе с остальной палитрой (включая будущую
                    // premium-кастомизацию через salons.theme_overrides).
                    backgroundColor: isBusiest
                      ? 'hsl(var(--primary))'
                      : `color-mix(in srgb, hsl(var(--primary)) ${25 + intensity * 45}%, transparent)`,
                  }}
                >
                  {counts[i] > 0 && (
                    <span
                      className={`text-xs font-semibold ${
                        intensity > 0.3 ? 'text-primary-foreground' : 'text-card-foreground/80'
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
        <div className="mt-5 pt-4 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="w-4 h-4 text-primary" />
          Самый загруженный день — <span className="font-medium text-card-foreground/90">{labels[busiestIdx]}</span>
        </div>
      )}
    </div>
  );
}