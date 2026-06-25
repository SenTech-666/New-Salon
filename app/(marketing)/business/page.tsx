'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Package,
  Link2,
  Smartphone,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Check,
} from 'lucide-react';
import { PLAN_DISPLAY, type PlanId } from '@/lib/plans';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const DAY_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// ============================================================
// ЖИВОЙ ВИДЖЕТ ЗАПИСИ — демо-данные
// ============================================================
// Это не статичная картинка и не упрощённый туториальный пример — те же
// сущности (мастер → расписание → слоты → занятость), что в реальном
// BookingPage, просто с фиктивными данными вместо Supabase, чтобы человек,
// ещё не зарегистрировавшись, увидел настоящий интерфейс продукта, а не
// абстрактный календарь "вообще".
type DemoMaster = {
  id: string;
  name: string;
  initial: string;
  color: string;
  slots: string[];
  taken: string[];
};

const DEMO_MASTERS: DemoMaster[] = [
  {
    id: 'anna',
    name: 'Анна',
    initial: 'А',
    color: 'var(--landing-accent)',
    slots: ['10:00', '10:30', '12:00', '14:30', '16:00', '17:00'],
    taken: ['10:30', '14:30'],
  },
  {
    id: 'sergey',
    name: 'Серёжа',
    initial: 'С',
    color: '#6B8FA8',
    slots: ['09:00', '09:30', '11:00', '13:00', '15:30', '18:00'],
    taken: ['09:30', '13:00'],
  },
  {
    id: 'katya',
    name: 'Катя',
    initial: 'К',
    color: '#8B7355',
    slots: ['10:00', '11:30', '13:30', '15:00', '16:30', '17:30'],
    taken: ['11:30', '16:30'],
  },
];

// Дни месяца, в которые у демо-мастеров "есть слоты" — для точки-индикатора
// в ячейке календаря, как на реальном BookingPage.
const DEMO_SLOT_DAYS = [3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29];

function DemoBookingWidget() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMasterId, setSelectedMasterId] = useState(DEMO_MASTERS[0].id);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [justBooked, setJustBooked] = useState(false);

  const selectedMaster = DEMO_MASTERS.find((m) => m.id === selectedMasterId)!;

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const leadingOffset = firstWeekday === 0 ? 6 : firstWeekday - 1; // неделя с понедельника

  const isPastMonth =
    viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  const handlePrevMonth = () => {
    if (isPastMonth) return;
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const handleNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(null);
    setSelectedSlot(null);
  };

  const handleSelectMaster = (id: string) => {
    setSelectedMasterId(id);
    setSelectedSlot(null);
  };

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setSelectedSlot(null);
  };

  const handleConfirm = () => {
    if (!selectedDay || !selectedSlot) return;
    setJustBooked(true);
    setTimeout(() => {
      setJustBooked(false);
      setSelectedDay(null);
      setSelectedSlot(null);
    }, 2800);
  };

  return (
    <div
      className="landing-glass rounded-[24px] p-6 sm:p-7"
      style={{ maxWidth: 400, width: '100%' }}
    >
      <div className="flex items-center justify-between mb-5">
        <span
          className="text-sm"
          style={{ fontFamily: 'var(--landing-font-display)', color: 'var(--landing-text)' }}
        >
          Запись к мастеру
        </span>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--landing-accent-12)', color: 'var(--landing-accent-dark)' }}
        >
          Живой виджет
        </span>
      </div>

      {/* Выбор мастера — те же чипы, что планируются для master_pick на BookingPage */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {DEMO_MASTERS.map((m) => (
          <button
            key={m.id}
            onClick={() => handleSelectMaster(m.id)}
            className="flex items-center gap-1.5 rounded-full pl-1.5 pr-3 py-1 transition-colors"
            style={{
              border: `1px solid ${selectedMasterId === m.id ? 'var(--landing-accent)' : 'var(--landing-glass-border)'}`,
              background: selectedMasterId === m.id ? 'var(--landing-accent-10)' : 'transparent',
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0"
              style={{ background: m.color, color: '#fff' }}
            >
              {m.initial}
            </span>
            <span className="text-xs" style={{ color: 'var(--landing-text)' }}>{m.name}</span>
          </button>
        ))}
      </div>

      {/* Календарь */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          disabled={isPastMonth}
          className="landing-nav-btn"
          style={{ width: 30, height: 30, opacity: isPastMonth ? 0.3 : 1 }}
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium" style={{ color: 'var(--landing-text)' }}>
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button onClick={handleNextMonth} className="landing-nav-btn" style={{ width: 30, height: 30 }} aria-label="Следующий месяц">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium py-1" style={{ color: 'var(--landing-text-faint)' }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-5">
        {Array.from({ length: leadingOffset }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isToday =
            day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
          const hasSlots = DEMO_SLOT_DAYS.includes(day);
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => handleSelectDay(day)}
              className="relative aspect-square rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
              style={{
                opacity: isPast ? 0.25 : 1,
                cursor: isPast ? 'default' : 'pointer',
                background: isSelected ? 'var(--landing-accent)' : 'var(--landing-cell-bg)',
                color: isSelected ? 'var(--landing-on-accent)' : isToday ? 'var(--landing-accent)' : 'var(--landing-text)',
                fontWeight: isToday || isSelected ? 600 : 500,
              }}
            >
              {day}
              {hasSlots && !isSelected && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: 'var(--landing-accent)', opacity: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Слоты времени */}
      {selectedDay && (
        <>
          <p className="text-[11px] font-medium uppercase tracking-wide mb-2.5" style={{ color: 'var(--landing-text-faint)' }}>
            Свободное время
          </p>
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {selectedMaster.slots.map((slot) => {
              const isTaken = selectedMaster.taken.includes(slot);
              const isSelected = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  disabled={isTaken}
                  onClick={() => setSelectedSlot(slot)}
                  className="rounded-lg py-2 text-xs font-medium text-center transition-transform"
                  style={{
                    background: isSelected ? 'var(--landing-accent)' : 'var(--landing-cell-bg)',
                    color: isSelected ? 'var(--landing-on-accent)' : isTaken ? 'var(--landing-text-faint)' : 'var(--landing-text)',
                    textDecoration: isTaken ? 'line-through' : 'none',
                    opacity: isTaken ? 0.45 : 1,
                    cursor: isTaken ? 'not-allowed' : 'pointer',
                  }}
                >
                  {slot}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selectedDay && selectedSlot && (
        <button
          onClick={handleConfirm}
          className="landing-submit-btn w-full h-11 rounded-xl text-sm font-semibold"
        >
          {justBooked ? `✓ Записано на ${selectedSlot}` : 'Подтвердить запись'}
        </button>
      )}
    </div>
  );
}

// ============================================================
// ТАБЫ "ДЛЯ КОГО"
// ============================================================
type AudienceId = 'salon' | 'barber' | 'free';

const AUDIENCE_CONTENT: Record<AudienceId, {
  tabLabel: string;
  headline: string;
  description: string;
  perks: string[];
  stats: { value: string; label: string; trend?: string }[];
}> = {
  salon: {
    tabLabel: 'Салон',
    headline: 'Всё, что нужно директору, в одной вкладке',
    description:
      'Несколько мастеров, разные услуги, общая запись — администратор видит картину целиком и не тонет в мессенджерах.',
    perks: [
      'Единая запись для всех мастеров с защитой персональных данных',
      'Разграничение ролей: владелец, менеджер, мастер',
      'Склад расходников — списание автоматически при закрытии записи',
      'Приглашение менеджеров по ссылке, без регистрации лишних аккаунтов',
    ],
    stats: [
      { value: '94%', label: 'клиентов приходят в назначенное время', trend: '↑ 12%' },
      { value: '3 мин', label: 'среднее время записи клиентом', trend: '–40 мин' },
      { value: '0 ₽', label: 'стоимость в период раннего доступа' },
    ],
  },
  barber: {
    tabLabel: 'Барбершоп',
    headline: 'Расписание под контролем — кресло не простаивает',
    description:
      'Настройте часы каждого барбера отдельно. Клиент сам выбирает мастера и время — администратор занят делом, не телефоном.',
    perks: [
      'Индивидуальные расписания + шаблоны на всю команду сразу',
      'Клиент видит только свободные слоты нужного мастера',
      'Кабинет мастера: видит только свои записи, без чужих данных',
      'Напоминания клиентам автоматически',
    ],
    stats: [
      { value: '5', label: 'минут — настройка нового мастера' },
      { value: '–80%', label: 'звонков с вопросом «а когда свободно?»', trend: '↑ продуктивно' },
      { value: '24/7', label: 'запись принимается даже когда вы спите' },
    ],
  },
  free: {
    tabLabel: 'Мастер-фрилансер',
    headline: 'Работаешь один — клиенты всё равно записываются сами',
    description:
      'Личная страница мастера с виджетом записи. Отправляете ссылку — клиент выбирает время, подтверждение приходит само.',
    perks: [
      'Готовая страница с вашими услугами и расписанием',
      'Ссылка на запись — в шапку инстаграма или телеграм-бот',
      'Кабинет с историей всех клиентов и суммами',
      'При росте — плавный переход в формат салона без переноса данных',
    ],
    stats: [
      { value: '1 ссылка', label: 'и клиент сам выбирает время' },
      { value: 'Без кода', label: 'настройка за 10 минут с нуля' },
      { value: '∞', label: 'история клиентов всегда под рукой' },
    ],
  },
};

// ============================================================
// ТАРИФЫ
// ============================================================
function formatRub(value: number) {
  if (value === 0) return '0';
  return new Intl.NumberFormat('ru-RU').format(value);
}

const PLAN_ORDER: PlanId[] = ['free', 'base', 'premium'];

export default function BusinessLandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [audience, setAudience] = useState<AudienceId>('salon');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  const activeAudience = AUDIENCE_CONTENT[audience];

  return (
    <div className="min-h-screen overflow-x-hidden landing-bp-bg" style={{ background: 'var(--landing-bg)' }}>

      {/* ══════════════════════════════════════════════════════
          NAV
          ══════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 sm:px-12 py-4"
        style={{
          background: 'color-mix(in srgb, var(--landing-bg) 88%, transparent)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--landing-border)',
        }}
      >
        <Link
          href="/"
          className="text-lg"
          style={{ fontFamily: 'var(--landing-font-display)', fontStyle: 'italic', color: 'var(--landing-text)' }}
        >
          aptio<span style={{ color: 'var(--landing-accent)' }}>·</span>для бизнеса
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm transition-colors" style={{ color: 'var(--landing-text-dim)' }}>Как это работает</a>
          <a href="#features" className="text-sm transition-colors" style={{ color: 'var(--landing-text-dim)' }}>Возможности</a>
          <a href="#pricing" className="text-sm transition-colors" style={{ color: 'var(--landing-text-dim)' }}>Тарифы</a>
          <Link href="/sign-in" className="text-sm transition-colors" style={{ color: 'var(--landing-text-dim)' }}>Войти</Link>
        </div>
        <Link
          href="/register"
          className="text-sm font-semibold px-5 py-2.5 rounded-full transition-transform hover:scale-[1.03]"
          style={{
            background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
            color: 'var(--landing-on-accent)',
          }}
        >
          Создать салон
        </Link>
      </nav>

      {/* ══════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-32 pb-20 px-6 sm:pt-40 sm:pb-28">
        <div
          className="absolute rounded-full pointer-events-none storefront-orb"
          style={{
            width: 360, height: 360, top: '-10%', left: '-8%',
            background: 'radial-gradient(circle, var(--landing-accent) 0%, transparent 70%)',
            filter: 'blur(60px)', opacity: 0.2,
          }}
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className={mounted ? 'storefront-fade-in' : 'opacity-0'}>
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase px-3.5 py-1.5 rounded-full mb-7"
                style={{ background: 'var(--landing-accent-12)', border: '1px solid var(--landing-accent-25)', color: 'var(--landing-accent-dark)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--landing-accent)' }} />
                14 дней бесплатно, без карты
              </div>

              <h1
                className="mb-5 leading-[1.02]"
                style={{
                  fontFamily: 'var(--landing-font-display)', fontStyle: 'italic', fontWeight: 700,
                  fontSize: 'clamp(38px, 5.5vw, 64px)', color: 'var(--landing-text)', letterSpacing: '-0.01em',
                }}
              >
                Запись клиентов,<br />
                которая <span style={{ color: 'var(--landing-accent)' }}>работает</span><br />
                пока вы работаете
              </h1>

              <p className="text-base sm:text-lg leading-relaxed mb-9 max-w-md" style={{ color: 'var(--landing-text-dim)' }}>
                Онлайн-запись, расписание мастеров и управление салоном — в одном месте.
                Для салонов, барбершопов и мастеров-фрилансеров.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Link href="/register">
                  <span
                    className="inline-flex items-center gap-2 text-base font-semibold px-8 py-4 rounded-full transition-transform hover:scale-[1.03] active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                      color: 'var(--landing-on-accent)',
                      boxShadow: '0 10px 30px var(--landing-accent-30)',
                    }}
                  >
                    Создать салон бесплатно
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <a
                  href="#how"
                  className="text-base px-6 py-4 rounded-full transition-colors"
                  style={{ color: 'var(--landing-text-dim)', border: '1px solid var(--landing-border)' }}
                >
                  Как это работает →
                </a>
              </div>
            </div>

            <div className={`flex justify-center lg:justify-end ${mounted ? 'storefront-fade-in-delayed' : 'opacity-0'}`}>
              <DemoBookingWidget />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ДЛЯ КОГО
          ══════════════════════════════════════════════════════ */}
      <section className="px-6 py-20 sm:py-24" style={{ background: 'var(--landing-surface)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--landing-accent)' }}>
            Для кого
          </p>
          <h2
            className="mb-10 max-w-xl"
            style={{ fontFamily: 'var(--landing-font-display)', fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 42px)', color: 'var(--landing-text)' }}
          >
            Одна платформа — три формата бизнеса
          </h2>

          <div
            className="inline-flex gap-1 rounded-2xl p-1 mb-10"
            style={{ background: 'var(--landing-bg-alt)' }}
          >
            {(Object.keys(AUDIENCE_CONTENT) as AudienceId[]).map((id) => (
              <button
                key={id}
                onClick={() => setAudience(id)}
                className="text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                style={{
                  background: audience === id ? 'var(--landing-surface)' : 'transparent',
                  color: audience === id ? 'var(--landing-text)' : 'var(--landing-text-faint)',
                  boxShadow: audience === id ? '0 1px 4px var(--landing-accent-15)' : 'none',
                }}
              >
                {AUDIENCE_CONTENT[id].tabLabel}
              </button>
            ))}
          </div>

          <div key={audience} className="landing-step-enter grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p
                className="mb-5"
                style={{ fontFamily: 'var(--landing-font-accent)', fontStyle: 'italic', fontSize: 26, fontWeight: 400, color: 'var(--landing-text)' }}
              >
                {activeAudience.headline}
              </p>
              <p className="text-base leading-relaxed mb-7" style={{ color: 'var(--landing-text-dim)' }}>
                {activeAudience.description}
              </p>
              <ul className="flex flex-col gap-3">
                {activeAudience.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm" style={{ color: 'var(--landing-text)' }}>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'var(--landing-accent-12)' }}
                    >
                      <Check className="w-3 h-3" style={{ color: 'var(--landing-accent)' }} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl p-6" style={{ background: 'var(--landing-bg-alt)' }}>
              {activeAudience.stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between gap-3 rounded-xl px-5 py-4" style={{ background: 'var(--landing-surface)' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--landing-font-display)', fontSize: 26, color: 'var(--landing-text)' }}>{stat.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--landing-text-faint)' }}>{stat.label}</p>
                  </div>
                  {stat.trend && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'var(--landing-success-bg)', color: 'var(--landing-success-text)' }}>
                      {stat.trend}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          КАК ЭТО РАБОТАЕТ
          ══════════════════════════════════════════════════════ */}
      <section id="how" className="px-6 py-20 sm:py-24" style={{ background: 'var(--landing-bg)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--landing-accent)' }}>
            Как это работает
          </p>
          <h2
            className="mb-14 max-w-xl"
            style={{ fontFamily: 'var(--landing-font-display)', fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 42px)', color: 'var(--landing-text)' }}
          >
            От регистрации до первой записи — меньше часа
          </h2>

          <div className="grid md:grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: 'var(--landing-border)' }}>
            {[
              { num: '01', title: 'Создайте профиль салона', desc: 'Название, адрес, услуги и цены. Добавьте мастеров — каждый получит своё расписание и личный кабинет.' },
              { num: '02', title: 'Поделитесь ссылкой на запись', desc: 'Уникальный адрес вашей страницы — в шапку профиля, в мессенджер, на сайт. Клиент открывает и выбирает удобное время.' },
              { num: '03', title: 'Принимайте и управляйте', desc: 'Новые записи — сразу в вашем кабинете. Статусы, история, склад, финансы — всё в одном месте без Excel и блокнотов.' },
            ].map((step) => (
              <div key={step.num} className="p-9" style={{ background: 'var(--landing-surface)' }}>
                <p style={{ fontFamily: 'var(--landing-font-display)', fontSize: 42, fontWeight: 300, color: 'var(--landing-accent-25)', lineHeight: 1, marginBottom: 18 }}>
                  {step.num}
                </p>
                <p className="text-lg mb-3" style={{ fontFamily: 'var(--landing-font-display)', color: 'var(--landing-text)' }}>{step.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--landing-text-dim)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ВОЗМОЖНОСТИ
          ══════════════════════════════════════════════════════ */}
      <section id="features" className="px-6 py-20 sm:py-24" style={{ background: 'var(--landing-bg-alt)' }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--landing-accent)' }}>
            Возможности
          </p>
          <h2
            className="mb-14 max-w-xl"
            style={{ fontFamily: 'var(--landing-font-display)', fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 42px)', color: 'var(--landing-text)' }}
          >
            Всё, что нужно — и ничего лишнего
          </h2>

          <div className="grid md:grid-cols-3 gap-3" style={{ gridTemplateRows: 'auto auto' }}>
            <div className="md:row-span-2 rounded-2xl p-8" style={{ background: 'var(--landing-surface)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: 'var(--landing-accent-10)' }}>
                <CalendarDays className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
              </div>
              <p className="text-2xl mb-3" style={{ fontFamily: 'var(--landing-font-display)', color: 'var(--landing-text)' }}>
                Умное расписание для каждого мастера
              </p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--landing-text-dim)' }}>
                Задайте шаблон рабочих часов один раз — и примените на всю команду. Каждый мастер
                настраивает свои исключения: отгулы, укороченные дни. Клиент всегда видит только
                реально свободные слоты.
              </p>
              <div className="rounded-xl p-4" style={{ background: 'var(--landing-bg-alt)' }}>
                {DEMO_MASTERS.slice(0, 2).map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 mb-3 last:mb-0">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                      style={{ background: m.color, color: '#fff' }}
                    >
                      {m.initial}
                    </span>
                    <div className="flex gap-1 flex-1">
                      {[0.2, 0.7, 0.2, 0.9].map((opacity, i) => (
                        <div key={i} className="h-5 rounded" style={{ flex: opacity * 2, background: m.color, opacity }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {[
              { Icon: ShieldCheck, title: 'Роли и доступы', desc: 'Владелец, менеджер, мастер — у каждого своё. Мастер видит только свои записи.' },
              { Icon: Package, title: 'Учёт расходников', desc: 'Склад пересчитывается автоматически при закрытии каждой записи.' },
              { Icon: Link2, title: 'Приглашения по ссылке', desc: 'Позвать мастера или менеджера — ссылка на 7 дней, одно нажатие.' },
              { Icon: Smartphone, title: 'Работает на телефоне', desc: 'Клиент записывается с мобильного — удобно и быстро.' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-2xl p-7" style={{ background: 'var(--landing-surface)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--landing-accent-10)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
                </div>
                <p className="text-lg mb-2" style={{ fontFamily: 'var(--landing-font-display)', color: 'var(--landing-text)' }}>{title}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--landing-text-dim)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          ТАРИФЫ
          ══════════════════════════════════════════════════════ */}
      <section id="pricing" className="px-6 py-20 sm:py-24" style={{ background: 'var(--landing-bg)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'var(--landing-accent)' }}>
              Тарифы
            </p>
            <h2
              className="mb-8"
              style={{ fontFamily: 'var(--landing-font-display)', fontWeight: 700, fontSize: 'clamp(28px, 3.5vw, 42px)', color: 'var(--landing-text)' }}
            >
              Начните бесплатно, растите без ограничений
            </h2>

            <div className="inline-flex gap-1 rounded-2xl p-1" style={{ background: 'var(--landing-surface)', border: '1px solid var(--landing-border)' }}>
              <button
                onClick={() => setBillingPeriod('monthly')}
                className="text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                style={{
                  background: billingPeriod === 'monthly' ? 'var(--landing-accent)' : 'transparent',
                  color: billingPeriod === 'monthly' ? 'var(--landing-on-accent)' : 'var(--landing-text-dim)',
                }}
              >
                Помесячно
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className="text-sm font-medium px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                style={{
                  background: billingPeriod === 'yearly' ? 'var(--landing-accent)' : 'transparent',
                  color: billingPeriod === 'yearly' ? 'var(--landing-on-accent)' : 'var(--landing-text-dim)',
                }}
              >
                За год
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: billingPeriod === 'yearly' ? 'rgba(255,255,255,0.25)' : 'var(--landing-success-bg)',
                    color: billingPeriod === 'yearly' ? 'var(--landing-on-accent)' : 'var(--landing-success-text)',
                  }}
                >
                  −20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {PLAN_ORDER.map((planId) => {
              const plan = PLAN_DISPLAY[planId];
              const price = billingPeriod === 'monthly' ? plan.priceMonthly : plan.priceYearly;
              return (
                <div
                  key={planId}
                  className="flex flex-col rounded-[24px] p-8"
                  style={{
                    background: plan.highlighted ? 'var(--landing-text)' : 'var(--landing-surface)',
                    border: plan.highlighted ? 'none' : '1px solid var(--landing-border)',
                    boxShadow: plan.highlighted ? '0 24px 50px -20px var(--landing-accent-30)' : 'none',
                  }}
                >
                  {plan.highlighted && (
                    <span
                      className="self-start text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full mb-5"
                      style={{ background: 'var(--landing-accent)', color: 'var(--landing-on-accent)' }}
                    >
                      Популярный выбор
                    </span>
                  )}

                  <p
                    className="text-xl mb-1.5"
                    style={{
                      fontFamily: 'var(--landing-font-display)',
                      color: plan.highlighted ? 'var(--landing-bg)' : 'var(--landing-text)',
                    }}
                  >
                    {plan.name}
                  </p>
                  <p
                    className="text-sm mb-6"
                    style={{ color: plan.highlighted ? 'rgba(250,247,243,0.65)' : 'var(--landing-text-dim)' }}
                  >
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1.5 mb-7">
                    <span
                      style={{
                        fontFamily: 'var(--landing-font-display)',
                        fontSize: 40,
                        color: plan.highlighted ? 'var(--landing-bg)' : 'var(--landing-text)',
                      }}
                    >
                      {price === 0 ? 'Бесплатно' : `${formatRub(price)} ₽`}
                    </span>
                    {price > 0 && (
                      <span className="text-sm" style={{ color: plan.highlighted ? 'rgba(250,247,243,0.55)' : 'var(--landing-text-faint)' }}>
                        /мес
                      </span>
                    )}
                  </div>

                  <ul className="flex flex-col gap-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm"
                        style={{ color: plan.highlighted ? 'rgba(250,247,243,0.9)' : 'var(--landing-text)' }}
                      >
                        <Check
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: plan.highlighted ? 'var(--landing-accent-light)' : 'var(--landing-accent)' }}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href="/register">
                    <span
                      className="flex items-center justify-center w-full h-12 rounded-full text-sm font-semibold transition-transform hover:scale-[1.02]"
                      style={
                        plan.highlighted
                          ? { background: 'var(--landing-accent)', color: 'var(--landing-on-accent)' }
                          : { background: 'var(--landing-accent-10)', color: 'var(--landing-accent-dark)' }
                      }
                    >
                      {planId === 'free' ? 'Начать бесплатно' : 'Выбрать тариф'}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm mt-10" style={{ color: 'var(--landing-text-faint)' }}>
            Все тарифы начинаются с 14-дневного бесплатного периода. Карта не нужна для старта.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA
          ══════════════════════════════════════════════════════ */}
      <section className="px-6 py-24 text-center" style={{ background: 'var(--landing-footer-bg)' }}>
        <div className="max-w-lg mx-auto">
          <Sparkles className="w-6 h-6 mx-auto mb-6" style={{ color: 'var(--landing-accent)' }} />
          <h2
            className="mb-5 leading-[1.1]"
            style={{ fontFamily: 'var(--landing-font-display)', fontStyle: 'italic', fontWeight: 600, fontSize: 'clamp(32px, 4.5vw, 52px)', color: 'var(--landing-footer-text)' }}
          >
            Хватит вести запись<br />
            в <span style={{ color: 'var(--landing-accent)' }}>мессенджерах</span>
          </h2>
          <p className="text-base mb-9 leading-relaxed" style={{ color: 'var(--landing-footer-text-dim)' }}>
            14 дней бесплатно. Без карты. Перенесём ваши услуги и мастеров за один звонок, если понадобится помощь.
          </p>
          <Link href="/register">
            <span
              className="inline-flex items-center gap-2 text-base font-semibold px-9 py-4 rounded-full transition-transform hover:scale-[1.03]"
              style={{
                background: `linear-gradient(to right, var(--landing-accent), var(--landing-accent-dark))`,
                color: 'var(--landing-on-accent)',
                boxShadow: '0 10px 30px var(--landing-accent-30)',
              }}
            >
              <CalendarCheck className="w-4 h-4" />
              Создать салон бесплатно
            </span>
          </Link>
          <p className="text-xs mt-6" style={{ color: 'var(--landing-footer-text-dim)' }}>
            Уже есть салон?{' '}
            <Link href="/sign-in" className="underline" style={{ color: 'var(--landing-footer-text)' }}>
              Войти
            </Link>
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════════ */}
      <footer
        className="px-6 sm:px-12 py-10 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: 'var(--landing-footer-bg)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span style={{ fontFamily: 'var(--landing-font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--landing-footer-text)' }}>
          aptio<span style={{ color: 'var(--landing-accent)' }}>·</span>для бизнеса
        </span>
        <div className="flex gap-6">
          <a href="#" className="text-xs" style={{ color: 'var(--landing-footer-text-dim)' }}>Политика конфиденциальности</a>
          <a href="#" className="text-xs" style={{ color: 'var(--landing-footer-text-dim)' }}>Условия использования</a>
          <a href="mailto:hello@aptio.ru" className="text-xs" style={{ color: 'var(--landing-footer-text-dim)' }}>Написать нам</a>
        </div>
        <span className="text-xs" style={{ color: 'var(--landing-footer-text-dim)' }}>© 2026 Aptio</span>
      </footer>
    </div>
  );
}