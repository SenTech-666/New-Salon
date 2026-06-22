import { TrendingUp, TrendingDown, Wallet, Users, Receipt, Scissors, XCircle } from 'lucide-react';

function trendPercent(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function Trend({ current, previous }: { current: number; previous: number }) {
  const pct = trendPercent(current, previous);
  if (pct === 0) return <span className="text-xs text-muted-foreground">без изменений</span>;
  const up = pct > 0;
  return (
    <span
      className={`text-xs font-medium flex items-center gap-0.5 ${
        up ? 'text-success' : 'text-destructive'
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(pct)}% к прошлому периоду
    </span>
  );
}

export default function StatsOverview({
  revenue,
  prevRevenue,
  clients,
  prevClients,
  avgTicket,
  cancelRate,
  topService,
  completedCount,
}: {
  revenue: number;
  prevRevenue: number;
  clients: number;
  prevClients: number;
  avgTicket: number;
  cancelRate: number;
  topService: string;
  completedCount: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <div className="bg-card rounded-3xl p-6 border border-border lg:col-span-2">
        <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center mb-4">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <p className="text-3xl font-bold text-card-foreground">{revenue.toLocaleString('ru-RU')} ₽</p>
        <p className="text-sm text-muted-foreground mt-1 mb-2">Выручка за период</p>
        <Trend current={revenue} previous={prevRevenue} />
      </div>

      <div className="bg-card rounded-3xl p-6 border border-border">
        <div className="w-10 h-10 bg-blue-500/15 rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <p className="text-3xl font-bold text-card-foreground">{clients}</p>
        <p className="text-sm text-muted-foreground mt-1 mb-2">Клиентов</p>
        <Trend current={clients} previous={prevClients} />
      </div>

      <div className="bg-card rounded-3xl p-6 border border-border">
        <div className="w-10 h-10 bg-success/15 rounded-2xl flex items-center justify-center mb-4">
          <Receipt className="w-5 h-5 text-success" />
        </div>
        <p className="text-3xl font-bold text-card-foreground">{avgTicket.toLocaleString('ru-RU')} ₽</p>
        <p className="text-sm text-muted-foreground mt-1">Средний чек</p>
        <p className="text-xs text-muted-foreground/70 mt-2">{completedCount} завершённых записей</p>
      </div>

      <div className="bg-card rounded-3xl p-6 border border-border">
        <div className="w-10 h-10 bg-amber-500/15 rounded-2xl flex items-center justify-center mb-4">
          <Scissors className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-lg font-bold text-card-foreground truncate" title={topService}>
          {topService}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Топ услуга по выручке</p>
      </div>

      <div className="bg-card rounded-3xl p-6 border border-border">
        <div className="w-10 h-10 bg-destructive/15 rounded-2xl flex items-center justify-center mb-4">
          <XCircle className="w-5 h-5 text-destructive" />
        </div>
        <p className="text-3xl font-bold text-card-foreground">{cancelRate}%</p>
        <p className="text-sm text-muted-foreground mt-1">Доля отмен</p>
      </div>
    </div>
  );
}