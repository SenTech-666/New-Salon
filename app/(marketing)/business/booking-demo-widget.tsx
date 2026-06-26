'use client';

// app/(marketing)/business/booking-demo-widget.tsx
//
// Демо-виджет записи для лендинга /business. Структура повторяет реальный
// UX BookingPage буквально, а не только "механику шагов":
//   1) Снаружи видна ТОЛЬКО карточка с календарём на месяц — как страница
//      записи клиента до открытия модалки. Никакого выбора услуги/мастера
//      на виду заранее, иначе это перестаёт быть честной демонстрацией
//      того, что человек увидит на /{slug}/booking.
//   2) Клик на доступный день открывает модалку оверлеем (затемнение +
//      всплывающая карточка), а не подменяет контент на месте — это и
//      есть та самая "модалка", о которой говорит реальный продукт.
//   3) Внутри модалки — четыре шага (услуга → мастер → время →
//      подтверждение) с прогресс-баром (landing-progress-track/-fill) и
//      slide-переходом между ними (landing-step-enter), кнопка "назад"
//      появляется со второго шага, явный крестик закрытия — один в один
//      с DialogHeader реальной модалки в BookingPage.
// Данные (DEMO_*) фиктивные, механика — нет.

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Scissors, User, Clock, CheckCircle2, X } from 'lucide-react';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const DAY_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type DemoStep = 'service' | 'master' | 'time' | 'done';
const STEP_ORDER: DemoStep[] = ['service', 'master', 'time', 'done'];

type DemoService = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

const DEMO_SERVICES: DemoService[] = [
  { id: 'haircut', name: 'Стрижка', duration: 40, price: 1800 },
  { id: 'color', name: 'Окрашивание', duration: 120, price: 4500 },
  { id: 'styling', name: 'Укладка', duration: 30, price: 1200 },
];

type DemoMaster = {
  id: string;
  name: string;
  specialty: string;
  initial: string;
  color: string;
  slots: string[];
  taken: string[];
};

const DEMO_MASTERS: DemoMaster[] = [
  {
    id: 'anna',
    name: 'Анна',
    specialty: 'Стрижки, окрашивание',
    initial: 'А',
    color: 'var(--landing-accent)',
    slots: ['10:00', '10:30', '12:00', '14:30', '16:00', '17:00'],
    taken: ['10:30', '14:30'],
  },
  {
    id: 'sergey',
    name: 'Серёжа',
    specialty: 'Стрижки, укладка',
    initial: 'С',
    color: '#6B8FA8',
    slots: ['09:00', '09:30', '11:00', '13:00', '15:30', '18:00'],
    taken: ['09:30', '13:00'],
  },
];

// Дни месяца, в которые у демо-мастеров "есть слоты" — для точки-индикатора
// в ячейке календаря, как на реальном BookingPage. Дни не из этого списка
// всё равно кликабельны (как и в реальном продукте — "нет слотов" выясняется
// только после выбора услуги и мастера внутри модалки, не блокируется
// заранее на уровне календаря).
const DEMO_SLOT_DAYS = [3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29];

export default function BookingDemoWidget() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [step, setStep] = useState<DemoStep>('service');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedMasterId, setSelectedMasterId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const selectedService = DEMO_SERVICES.find((s) => s.id === selectedServiceId) ?? null;
  const selectedMaster = DEMO_MASTERS.find((m) => m.id === selectedMasterId) ?? null;
  const stepIndex = STEP_ORDER.indexOf(step);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const leadingOffset = firstWeekday === 0 ? 6 : firstWeekday - 1; // неделя с понедельника

  // Блокируем переход НАЗАД по месяцам, когда уже стоим на текущем —
  // идти раньше него в демо-виджете незачем (аналог isBeyondHorizon/
  // isPastDay в реальном BookingPage, только на уровне месяца, не дня).
  const isCurrentMonth =
    viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth();

  const handlePrevMonth = () => {
    if (isCurrentMonth) return;
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  // Открытие модалки строго по клику на день, как в реальном
  // BookingPage.handleDayClick — снаружи до этого момента нет ни намёка
  // на выбор услуги/мастера.
  const handleDayClick = (day: number, isPast: boolean) => {
    if (isPast) return;
    setSelectedDate(day);
    setStep('service');
    setSelectedServiceId(null);
    setSelectedMasterId(null);
    setSelectedSlot(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectService = (id: string) => {
    setSelectedServiceId(id);
    setStep('master');
  };

  const handleSelectMaster = (id: string) => {
    setSelectedMasterId(id);
    setStep('time');
  };

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setStep('done');
  };

  const handleBack = () => {
    if (step === 'master') {
      setStep('service');
      setSelectedMasterId(null);
    } else if (step === 'time') {
      setStep('master');
      setSelectedSlot(null);
    } else if (step === 'done') {
      setStep('time');
    }
  };

  return (
    <div style={{ position: 'relative', maxWidth: 400, width: '100%' }}>
      {/* ══════════════════════════════════════════════════
          Карточка с календарём — это всё, что видно снаружи,
          один в один со страницей записи до открытия модалки.
          ══════════════════════════════════════════════════ */}
      <div className="landing-glass rounded-[24px] p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm" style={{ fontFamily: 'var(--landing-font-display)', color: 'var(--landing-text)' }}>
            Запись к мастеру
          </span>
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--landing-accent-12)', color: 'var(--landing-accent-dark)' }}
          >
            Живой виджет
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrevMonth}
            disabled={isCurrentMonth}
            className="landing-nav-btn"
            style={{ width: 30, height: 30, opacity: isCurrentMonth ? 0.3 : 1 }}
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

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingOffset }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
            const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isToday =
              day === today.getDate() && viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();
            const hasSlots = DEMO_SLOT_DAYS.includes(day);
            const isSelected = selectedDate === day;

            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => handleDayClick(day, isPast)}
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
      </div>

      {/* ══════════════════════════════════════════════════
          Модалка — оверлей поверх карточки виджета (не на всю
          страницу), открывается только после клика на день.
          ══════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div
          className="absolute inset-0 flex items-center justify-center p-3"
          style={{ background: 'rgba(28, 22, 14, 0.45)', borderRadius: 24, zIndex: 20 }}
          onClick={handleCloseModal}
        >
          <div
            className="landing-modal rounded-[24px] w-full flex flex-col"
            style={{ maxHeight: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* DialogHeader — крестик закрытия + кнопка "назад" с шага 2, как в BookingPage */}
            <div className="landing-modal-header flex items-center gap-3 px-5 py-4 flex-shrink-0">
              {step !== 'service' ? (
                <button onClick={handleBack} className="landing-nav-btn" style={{ width: 32, height: 32 }} aria-label="Назад">
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : (
                <span style={{ width: 32, height: 32, flexShrink: 0 }} aria-hidden="true" />
              )}
              <div className="flex-1 text-center">
                <p className="text-sm" style={{ fontFamily: 'var(--landing-font-display)', color: 'var(--landing-text)' }}>
                  {selectedDate} {MONTHS[viewDate.getMonth()]}
                </p>
              </div>
              <button onClick={handleCloseModal} className="landing-nav-btn landing-modal-close" style={{ width: 32, height: 32 }} aria-label="Закрыть">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Прогресс-бар — те же 4 шага, что в реальной модалке BookingPage */}
            <div className="landing-progress-track flex-shrink-0">
              <div className="landing-progress-fill" style={{ width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` }} />
            </div>

            <div className="p-5 overflow-y-auto">
              <div key={step} className="landing-step-enter">
                {step === 'service' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Scissors className="w-3.5 h-3.5" style={{ color: 'var(--landing-accent)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--landing-text-dim)' }}>Выберите услугу</span>
                    </div>
                    {DEMO_SERVICES.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectService(s.id)}
                        className="landing-option-card text-left flex items-center justify-between"
                        style={{ padding: '14px 16px' }}
                      >
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--landing-text)' }}>{s.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--landing-text-faint)' }}>{s.duration} мин</p>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--landing-accent)', fontFamily: 'var(--landing-font-display)' }}>
                          {s.price.toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {step === 'master' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3.5 h-3.5" style={{ color: 'var(--landing-accent)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--landing-text-dim)' }}>Выберите мастера</span>
                    </div>
                    {DEMO_MASTERS.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectMaster(m.id)}
                        className="landing-option-card flex items-center gap-3"
                        style={{ padding: '14px 16px' }}
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ background: m.color, color: '#fff' }}
                        >
                          {m.initial}
                        </span>
                        <div className="text-left">
                          <p className="text-sm font-semibold" style={{ color: 'var(--landing-text)' }}>{m.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--landing-text-faint)' }}>{m.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {step === 'time' && selectedMaster && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-3.5 h-3.5" style={{ color: 'var(--landing-accent)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--landing-text-dim)' }}>
                        Свободное время у {selectedMaster.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {selectedMaster.slots.map((slot) => {
                        const isTaken = selectedMaster.taken.includes(slot);
                        return (
                          <button
                            key={slot}
                            disabled={isTaken}
                            onClick={() => handleSelectSlot(slot)}
                            className="rounded-lg py-2 text-xs font-medium text-center transition-transform"
                            style={{
                              background: 'var(--landing-cell-bg)',
                              color: isTaken ? 'var(--landing-text-faint)' : 'var(--landing-text)',
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
                  </div>
                )}

                {step === 'done' && selectedService && selectedMaster && selectedDate && selectedSlot && (
                  <div className="flex flex-col items-center text-center gap-4 py-4">
                    <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--landing-success-bg)' }}>
                      <CheckCircle2 className="w-6 h-6" style={{ color: 'var(--landing-success-text)' }} />
                    </span>
                    <div>
                      <p className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--landing-font-display)', color: 'var(--landing-text)' }}>
                        Записано
                      </p>
                      <p className="text-sm" style={{ color: 'var(--landing-text-dim)' }}>
                        {selectedService.name} у {selectedMaster.name}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--landing-text-dim)' }}>
                        {selectedDate} {MONTHS[viewDate.getMonth()].toLowerCase()} в {selectedSlot}
                      </p>
                    </div>
                    <button onClick={handleCloseModal} className="landing-submit-btn w-full h-11 rounded-xl text-sm font-semibold mt-1">
                      Закрыть
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}