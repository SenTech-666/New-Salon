import { Crown } from 'lucide-react';

type MasterStat = {
  name: string;
  bookingsCount: number;
  revenue: number;
};

export default function MastersRanking({ ranking }: { ranking: MasterStat[] }) {
  const maxRevenue = ranking[0]?.revenue ?? 1;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6">
      <h2 className="font-semibold text-slate-900 mb-1">Рейтинг мастеров</h2>
      <p className="text-sm text-slate-400 mb-6">По выручке за выбранный период</p>

      {ranking.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">
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
                      <Crown className="w-4 h-4 text-[#c9a08a]" />
                    ) : (
                      <span className="text-xs font-medium text-slate-400 w-4 text-center">
                        {i + 1}
                      </span>
                    )}
                    <span className="text-sm font-medium text-slate-800">{m.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-900">
                      {m.revenue.toLocaleString('ru-RU')} ₽
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{m.bookingsCount} зап.</span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      i === 0 ? 'bg-[#c9a08a]' : 'bg-slate-300'
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