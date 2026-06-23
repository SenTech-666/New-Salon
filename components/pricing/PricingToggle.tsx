'use client';

// components/pricing/PricingToggle.tsx
//
// Переключатель помесячной/годовой оплаты + сетка карточек тарифов.
// Сами тарифы (PlanDisplay[]) приходят с сервера из app/pricing/page.tsx,
// здесь только локальный UI-стейт period.

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import type { PlanDisplay } from '@/lib/plans';

export default function PricingToggle({ plans }: { plans: PlanDisplay[] }) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-12">
        <button
          onClick={() => setPeriod('monthly')}
          className={`px-5 py-2 rounded-2xl text-sm font-medium transition-all ${
            period === 'monthly'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Помесячно
        </button>
        <button
          onClick={() => setPeriod('yearly')}
          className={`px-5 py-2 rounded-2xl text-sm font-medium transition-all flex items-center gap-2 ${
            period === 'yearly'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          За год
          <span className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success">
            -19%
          </span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const price = period === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          return (
            <div
              key={plan.id}
              className={`rounded-3xl border p-8 flex flex-col ${
                plan.highlighted
                  ? 'border-primary bg-primary/5 shadow-lg relative'
                  : 'border-border bg-card'
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-8 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Популярный выбор
                </span>
              )}

              <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

              <div className="mb-6">
                {price === 0 ? (
                  <span className="text-4xl font-bold">Бесплатно</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold">{price.toLocaleString('ru-RU')} ₽</span>
                    <span className="text-muted-foreground text-sm"> /мес</span>
                  </>
                )}
                {period === 'yearly' && price > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">при оплате за год</p>
                )}
                {plan.id === 'free' && (
                  <p className="text-xs text-muted-foreground mt-1">14 дней триала</p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-card-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`h-12 rounded-2xl flex items-center justify-center text-sm font-medium transition-all ${
                  plan.highlighted
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'border border-border hover:bg-muted text-card-foreground'
                }`}
              >
                {plan.id === 'free' ? 'Начать бесплатно' : 'Выбрать тариф'}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}