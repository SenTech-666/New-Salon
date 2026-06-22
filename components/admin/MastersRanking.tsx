import { Crown } from 'lucide-react';

type MasterStat = {
  name: string;
  bookingsCount: number;
  revenue: number;
};

export default function MastersRanking({ ranking }: { ranking: MasterStat[] }) {
  const maxRevenue = ranking[0]?.revenue ?? 1;

  return (
    <div className="bg-card rounded-3xl border border-border p-6">
      <h2 className="font-semibold text-card-foreground mb-1">Рейтинг мастеров</h2>
      <p className="text-sm text-muted-foreground mb-6">По выручке за выбранный период</p>

      {ranking.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Нет завершённых записей за этот период
        </p>
      ) : (
        <div className="space-y-5">
          {ranking.map((m, i) => {
            const widthPct = Math.max(8, Math.round((m.revenue / maxRevenue) * 100));
            return (
              <div key={m.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {i === 0 ? (
                      <Crown className="w-4 h-4 text-primary" />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground w-4 text-center">
                        {i + 1}
                      </span>
                    )}
                    <span className="text-sm font-medium text-card-foreground/90">{m.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-card-foreground">
                      {m.revenue.toLocaleString('ru-RU')} ₽
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">{m.bookingsCount} зап.</span>
                  </div>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}