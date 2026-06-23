// app/pricing/page.tsx
//
// Бизнес-страница с тарифами Aptio. Цены берутся из lib/plans.ts —
// единого источника правды, который также используется для проверки
// лимитов в коде (см. PLAN_LIMITS). Здесь только отображение, никакой
// логики проверки доступа.

import Link from 'next/link';
import { Check } from 'lucide-react';
import { PLAN_DISPLAY } from '@/lib/plans';
import PricingToggle from '@/components/pricing/PricingToggle';

export const metadata = {
  title: 'Тарифы — Aptio',
  description: 'Тарифы платформы Aptio для онлайн-записи и управления салоном красоты.',
};

export default function PricingPage() {
  const plans = [PLAN_DISPLAY.free, PLAN_DISPLAY.base, PLAN_DISPLAY.premium];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Тарифы Aptio</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Начните бесплатно. Переходите на платный тариф, когда салону
            понадобится больше мастеров и возможностей.
          </p>
        </div>

        <PricingToggle plans={plans} />

        <p className="text-center text-sm text-muted-foreground mt-12">
          Остались вопросы по тарифам?{' '}
          <a href="mailto:hello@aptio.ru" className="text-primary hover:underline">
            Напишите нам
          </a>
        </p>
      </section>
    </main>
  );
}