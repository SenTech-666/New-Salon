'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Clock, User, Scissors, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { generateTimeSlots, dayOfWeekFromDateString } from '@/lib/scheduling';

type Master = {
  id: string;
  name: string;
  specialty: string;
};

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type WeeklyHourRow = {
  day_of_week: number;
  is_day_off: boolean;
  time_from: string | null;
  time_to: string | null;
};

type BlockRow = {
  master_id: string;
  date_from: string;
  date_to: string;
  is_full_day: boolean;
  time_from: string | null;
  time_to: string | null;
  reason: string | null;
};

type SalonInfo = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  photo_url: string | null;
  booking_horizon_days: number;
  slot_interval_minutes: number;
};

// Один анонимный клиент на модуль (не на каждый рендер) — устраняет
// предупреждение "Multiple GoTrueClient instances detected".
const supabase = createClient();

export default function BookingPage({ salonSlug }: { salonSlug: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<'masters' | 'services' | 'time' | 'client'>('masters');
  const [selectedMaster, setSelectedMaster] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmedBookings, setConfirmedBookings] = useState<number[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notFoundSalon, setNotFoundSalon] = useState(false);

  // Переключатель темы перенесён в Footer главной страницы лендинга —
  // здесь, на странице бронирования, он больше не нужен и не должен
  // плавать над контентом во время прохождения шагов записи.

  // Резолвится один раз через get_public_salon_by_slug. salonId нужен
  // явно при INSERT в bookings — RLS на bookings_insert теперь проверяет
  // реальный существующий salon_id, а не "угадывает" текущий салон через
  // RLS-переменные сессии (это не работает между отдельными HTTP-запросами
  // анонимного клиента — проверено через документацию PostgREST).
  const [salonId, setSalonId] = useState<string | null>(null);
  const [salonInfo, setSalonInfo] = useState<SalonInfo | null>(null);
  const [bookingHorizonDays, setBookingHorizonDays] = useState(30);
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(30);

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<Set<string>>(new Set());
  const [fullDayBlocked, setFullDayBlocked] = useState(false);
  const [fullDayReason, setFullDayReason] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [unavailableMasterIds, setUnavailableMasterIds] = useState<Set<string>>(new Set());
  const [loadingMasterAvailability, setLoadingMasterAvailability] = useState(false);

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  // Резолв салона по slug + загрузка мастеров и услуг — всё через
  // публичные RPC-функции, потому что прямой SELECT на masters/services/
  // salons теперь виден только владельцу через Clerk (current_salon_id()).
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const salonRes = await supabase.rpc('get_public_salon_by_slug', { p_slug: salonSlug });
        if (!isMounted) return;

        const salon = salonRes.data?.[0];
        if (salonRes.error || !salon) {
          setNotFoundSalon(true);
          setLoading(false);
          return;
        }

        setSalonId(salon.id);
        setSalonInfo(salon);
        setBookingHorizonDays(salon.booking_horizon_days ?? 30);
        setSlotIntervalMinutes(salon.slot_interval_minutes ?? 30);

        const [mastersRes, servicesRes] = await Promise.all([
          supabase.rpc('get_public_masters', { p_salon_slug: salonSlug }),
          supabase.rpc('get_public_services', { p_salon_slug: salonSlug }),
        ]);

        if (!isMounted) return;

        setMasters(mastersRes.data ?? []);
        setServices(servicesRes.data ?? []);
      } catch (error: any) {
        console.error('Ошибка загрузки данных салона:', error);
        toast.error('Не удалось загрузить данные', {
          className: 'bp-toast bp-toast-error',
          icon: <AlertCircle className="bp-toast-icon" />,
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [salonSlug]);

  // При открытии модалки (выбрана дата) подгружаем, какие мастера
  // недоступны на эту дату: get_public_master_blocks принимает диапазон
  // дат (без master_id) и возвращает блокировки всех мастеров салона —
  // фильтруем is_full_day локально. Выходной по недельному графику
  // проверяется отдельным вызовом get_public_master_weekly_hours на
  // каждого мастера (она принимает master_id и возвращает все 7 дней).
  useEffect(() => {
    if (!isModalOpen || !selectedDate || masters.length === 0) return;

    let isMounted = true;

    const fetchUnavailableMasters = async () => {
      setLoadingMasterAvailability(true);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      const dayOfWeek = dayOfWeekFromDateString(dateStr);

      try {
        const [blocksRes, ...hoursResList] = await Promise.all([
          supabase.rpc('get_public_master_blocks', {
            p_salon_slug: salonSlug,
            p_date_from: dateStr,
            p_date_to: dateStr,
          }),
          ...masters.map((m) =>
            supabase.rpc('get_public_master_weekly_hours', {
              p_salon_slug: salonSlug,
              p_master_id: m.id,
            })
          ),
        ]);

        if (!isMounted) return;

        const unavailable = new Set<string>();

        ((blocksRes.data as BlockRow[] | null) ?? []).forEach((b) => {
          if (b.is_full_day) unavailable.add(b.master_id);
        });

        masters.forEach((m, i) => {
          const rows: WeeklyHourRow[] = hoursResList[i]?.data ?? [];
          const todayRow = rows.find((r) => r.day_of_week === dayOfWeek);
          if (todayRow?.is_day_off) unavailable.add(m.id);
        });

        setUnavailableMasterIds(unavailable);
      } catch (error: any) {
        console.error('Ошибка загрузки доступности мастеров:', error);
      } finally {
        if (isMounted) setLoadingMasterAvailability(false);
      }
    };

    fetchUnavailableMasters();

    return () => {
      isMounted = false;
    };
  }, [isModalOpen, selectedDate, currentMonth, currentYear, masters, salonSlug]);

  // Шаг выбора времени: график выбранного мастера на этот день недели +
  // занятость. Занятые/отменённые записи берутся через get_taken_slots —
  // узкую функцию, которая отдаёт только время и статус, без имени и
  // телефона чужого клиента.
  useEffect(() => {
    if (currentStep !== 'time' || !selectedMaster || !selectedDate || !selectedService) return;

    let isMounted = true;

    const fetchAvailability = async () => {
      setLoadingSlots(true);
      setAvailableTimeSlots([]);
      setBlockedTimeSlots(new Set());
      setFullDayBlocked(false);
      setFullDayReason(null);
      setTakenSlots(new Set());

      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      const dayOfWeek = dayOfWeekFromDateString(dateStr);
      const service = services.find((s) => s.id === selectedService);
      const serviceDuration = service?.duration ?? 30;

      try {
        const [hoursRes, blocksRes, takenRes] = await Promise.all([
          supabase.rpc('get_public_master_weekly_hours', {
            p_salon_slug: salonSlug,
            p_master_id: selectedMaster,
          }),
          supabase.rpc('get_public_master_blocks', {
            p_salon_slug: salonSlug,
            p_date_from: dateStr,
            p_date_to: dateStr,
          }),
          supabase.rpc('get_taken_slots', {
            p_salon_slug: salonSlug,
            p_master_id: selectedMaster,
            p_date: dateStr,
          }),
        ]);

        if (!isMounted) return;

        const hours: WeeklyHourRow[] = hoursRes.data ?? [];
        const schedule = hours.find((h) => h.day_of_week === dayOfWeek);

        if (!schedule || schedule.is_day_off || !schedule.time_from || !schedule.time_to) {
          setFullDayBlocked(true);
          setFullDayReason('Мастер не работает в этот день');
          setLoadingSlots(false);
          return;
        }

        const slots = generateTimeSlots(
          schedule.time_from,
          schedule.time_to,
          slotIntervalMinutes,
          serviceDuration
        );

        const blocked = new Set<string>();
        let isFullDay = false;
        let reason: string | null = null;

        ((blocksRes.data as BlockRow[] | null) ?? [])
          .filter((b) => b.master_id === selectedMaster)
          .forEach((b) => {
            if (b.is_full_day) {
              isFullDay = true;
              reason = b.reason ?? 'Выходной';
              return;
            }
            if (b.time_from && b.time_to) {
              const from = b.time_from.slice(0, 5);
              const to = b.time_to.slice(0, 5);
              slots.forEach((slot) => {
                if (slot >= from && slot < to) blocked.add(slot);
              });
            }
          });

        const taken = new Set<string>(
          ((takenRes.data as { booking_time: string; status: string }[] | null) ?? [])
            .filter((t) => t.status !== 'cancelled')
            .map((t) => String(t.booking_time).slice(0, 5))
        );

        setAvailableTimeSlots(slots);
        setBlockedTimeSlots(blocked);
        setFullDayBlocked(isFullDay);
        setFullDayReason(reason);
        setTakenSlots(taken);
      } catch (error: any) {
        console.error('Ошибка загрузки занятости:', error);
        toast.error('Не удалось проверить занятость мастера', {
          className: 'bp-toast bp-toast-error',
          icon: <AlertCircle className="bp-toast-icon" />,
        });
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, [currentStep, selectedMaster, selectedDate, selectedService, currentMonth, currentYear, services, slotIntervalMinutes, salonSlug]);

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  const isPastDay = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentYear, currentMonth, day);
    return checkDate < today;
  };

  const isBeyondHorizon = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingHorizonDays);
    const checkDate = new Date(currentYear, currentMonth, day);
    return checkDate > maxDate;
  };

  const getDayStatus = (day: number) => {
    if (isPastDay(day)) return { status: 'past' as const };
    if (isBeyondHorizon(day)) return { status: 'beyond' as const };
    if (confirmedBookings.includes(day)) return { status: 'confirmed' as const };
    return { status: 'free' as const };
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const handleDayClick = (day: number) => {
    if (isPastDay(day) || isBeyondHorizon(day)) return;
    setSelectedDate(day);
    setCurrentStep('masters');
    setSelectedMaster('');
    setSelectedService('');
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setIsModalOpen(true);
  };

  const handleMasterSelect = (masterId: string) => {
    setSelectedMaster(masterId);
    setCurrentStep('services');
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setCurrentStep('time');
  };

  const handleTimeSelect = (time: string) => {
    if (blockedTimeSlots.has(time) || takenSlots.has(time) || fullDayBlocked) return;
    setSelectedTime(time);
    setCurrentStep('client');
  };

  const handleBack = () => {
    if (currentStep === 'services') {
      setCurrentStep('masters');
      setSelectedMaster('');
    } else if (currentStep === 'time') {
      setCurrentStep('services');
      setSelectedService('');
    } else if (currentStep === 'client') {
      setCurrentStep('time');
      setSelectedTime('');
    }
  };

  // Закрытие модалки — единая точка, чтобы крестик и Dialog всегда
  // закрывались одинаково (через onOpenChange), без рассинхрона состояния.
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmBooking = async () => {
    if (!salonId || !selectedDate || !selectedMaster || !selectedService || !selectedTime || !clientName.trim() || !clientPhone.trim()) {
      toast.error('Пожалуйста, заполните все поля', {
        className: 'bp-toast bp-toast-error',
        icon: <AlertCircle className="bp-toast-icon" />,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('bookings').insert({
        salon_id: salonId,
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`,
        time: selectedTime,
        master_id: selectedMaster,
        service_id: selectedService,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        status: 'pending',
      });

      if (error) throw error;

      setConfirmedBookings((prev) => [...prev, selectedDate]);
      setIsModalOpen(false);

      toast.success('Запись успешно создана!', {
        description: `${selectedDate} ${monthNames[currentMonth]} ${currentYear} • ${selectedTime}`,
        duration: 6000,
        className: 'bp-toast bp-toast-success',
        icon: <CheckCircle2 className="bp-toast-icon" />,
      });

      setSelectedMaster('');
      setSelectedService('');
      setSelectedTime('');
      setClientName('');
      setClientPhone('');
    } catch (error: any) {
      console.error(error);
      toast.error('Ошибка при записи', {
        description: error.message || 'Попробуйте позже',
        className: 'bp-toast bp-toast-error',
        icon: <AlertCircle className="bp-toast-icon" />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Шаги модалки в порядке прохождения — используется для прогресс-бара.
  const stepOrder: Array<typeof currentStep> = ['masters', 'services', 'time', 'client'];
  const stepIndex = stepOrder.indexOf(currentStep);

  if (notFoundSalon) {
    return (
      <div className={`min-h-screen flex items-center justify-center bp-bg`}>
        <p className="text-xl" style={{ color: 'var(--bp-text-dim)' }}>Салон не найден</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center bp-bg`}>
        <p className="text-xl" style={{ color: 'var(--bp-text-dim)' }}>Загрузка мастеров и услуг...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bp-bg pb-12 relative overflow-hidden`}>

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative">
        <div className="pt-12 pb-10">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            {salonInfo?.photo_url ? (
              <img
                src={salonInfo.photo_url}
                alt={salonInfo.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bp-accent-10)' }}>
                <span className="text-3xl font-bold" style={{ color: 'var(--bp-accent)', fontFamily: 'var(--bp-font-display)' }}>
                  {salonInfo?.name?.[0] ?? '?'}
                </span>
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight" style={{ color: 'var(--bp-text)', fontFamily: 'var(--bp-font-display)' }}>
                {salonInfo?.name ?? 'Онлайн-запись'}
              </h1>
              {salonInfo?.description && (
                <p className="mt-1 text-lg" style={{ color: 'var(--bp-text-dim)' }}>{salonInfo.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2 justify-center sm:justify-start">
                {salonInfo?.address && (
                  <span className="text-sm flex items-center gap-1" style={{ color: 'var(--bp-text-faint)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {salonInfo.address}
                  </span>
                )}
                {salonInfo?.phone && (
                  <a
                    href={`tel:${salonInfo.phone}`}
                    className="text-sm flex items-center gap-1 transition-colors"
                    style={{ color: 'var(--bp-accent)' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 6.75z" />
                    </svg>
                    {salonInfo.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Подложка календаря — стекло (glassmorphism) */}
        <div className="bp-glass" style={{ borderRadius: 24, overflow: 'hidden' }}>
          <div className="flex flex-row items-center justify-between px-6 sm:px-10 pt-8 pb-8">
            <button onClick={handlePrevMonth} className="bp-nav-btn" aria-label="Предыдущий месяц">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h2 className="text-3xl md:text-4xl font-medium" style={{ color: 'var(--bp-text)', fontFamily: 'var(--bp-font-display)' }}>
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button onClick={handleNextMonth} className="bp-nav-btn" aria-label="Следующий месяц">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 sm:px-8 pb-10">
            <div className="grid grid-cols-7 gap-2 mb-6 text-center text-sm font-medium" style={{ color: 'var(--bp-text-dim)' }}>
              {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const { status } = getDayStatus(day);
                const isSelected = selectedDate === day;
                const isDisabled = status === 'past' || status === 'beyond';

                return (
                  <button
                    key={day}
                    onClick={() => handleDayClick(day)}
                    disabled={isDisabled}
                    className={`bp-day-cell ${isSelected ? 'bp-day-selected' : ''} ${status === 'confirmed' ? 'bp-day-confirmed' : ''}`}
                    style={{ animationDelay: `${day * 10}ms` }}
                  >
                    <span className="bp-day-num">{day}</span>
                    <span className="bp-day-label">
                      {status === 'past' && <span style={{ color: 'var(--bp-text-faint)' }}>Прошёл</span>}
                      {status === 'beyond' && <span style={{ color: 'var(--bp-text-faint)' }}>Недоступно</span>}
                      {status === 'confirmed' && <span style={{ color: 'var(--bp-accent)', fontWeight: 600 }}>Ваша</span>}
                      {status === 'free' && <span style={{ color: 'var(--bp-success)' }}>Свободно</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {/* Модалка — тоже стекло, плюс прогресс-бар шагов и slide+fade переход контента.
            showCloseButton={false} убирает дефолтный крестик shadcn — он рендерится
            absolute right-4 top-4 внутри DialogContent и физически перекрывался нашим
            sticky-хедером, из-за чего клики до него не доходили. Вместо него — наша
            явная кнопка ниже, в потоке документа, гарантированно кликабельная. */}
        <DialogContent
          showCloseButton={false}
          className={`bp-modal max-w-lg w-[95%] max-h-[92vh] overflow-hidden rounded-3xl p-0 flex flex-col`}
        >
          <DialogHeader className="bp-modal-header sticky top-0 z-10 px-6 py-5 flex flex-row items-center gap-3 shrink-0">
            {currentStep !== 'masters' ? (
              <button onClick={handleBack} className="bp-nav-btn" style={{ width: 40, height: 40 }} aria-label="Назад">
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <span style={{ width: 40, height: 40, flexShrink: 0 }} aria-hidden="true" />
            )}
            <div className="flex-1 text-center">
              <DialogTitle className="text-2xl font-semibold" style={{ color: 'var(--bp-text)', fontFamily: 'var(--bp-font-display)' }}>
                {selectedDate} {monthNames[currentMonth]} {currentYear}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1" style={{ color: 'var(--bp-text-dim)' }}>
                Запись за 30 секунд
              </DialogDescription>
            </div>
            <button
              onClick={handleCloseModal}
              className="bp-nav-btn bp-modal-close"
              style={{ width: 40, height: 40 }}
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          {/* Прогресс-бар: заливается акцентом по мере прохождения шагов */}
          <div className="bp-progress-track">
            <div className="bp-progress-fill" style={{ width: `${((stepIndex + 1) / stepOrder.length) * 100}%` }} />
          </div>

          <div className="flex-1 overflow-y-auto bp-modal-scrollbar p-6 sm:p-8">
            <div key={currentStep} className="bp-step-enter space-y-10">
              {currentStep === 'masters' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bp-accent-10)' }}>
                      <User className="w-5 h-5" style={{ color: 'var(--bp-accent)' }} />
                    </div>
                    <h3 className="text-2xl font-semibold" style={{ color: 'var(--bp-text)' }}>Выберите мастера</h3>
                  </div>

                  {loadingMasterAvailability ? (
                    <p className="text-center py-8" style={{ color: 'var(--bp-text-faint)' }}>Проверяем доступность мастеров...</p>
                  ) : (
                    <div className="space-y-4">
                      {masters
                        .filter((master) => !unavailableMasterIds.has(master.id))
                        .map((master, i) => (
                          <div
                            key={master.id}
                            onClick={() => handleMasterSelect(master.id)}
                            className={`bp-option-card ${selectedMaster === master.id ? 'bp-option-selected' : ''}`}
                            style={{ animationDelay: `${i * 60}ms` }}
                          >
                            <p className="font-semibold text-xl" style={{ color: 'var(--bp-text)' }}>{master.name}</p>
                            <p className="mt-1" style={{ color: 'var(--bp-text-dim)' }}>{master.specialty}</p>
                          </div>
                        ))}

                      {masters.filter((m) => !unavailableMasterIds.has(m.id)).length === 0 && (
                        <div className="bp-warning-box">
                          <p className="font-medium" style={{ color: 'var(--bp-warning-text)' }}>
                            В этот день никто из мастеров не работает
                          </p>
                          <p className="text-sm mt-2" style={{ color: 'var(--bp-text-dim)' }}>
                            Выберите другую дату
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'services' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bp-accent-10)' }}>
                      <Scissors className="w-5 h-5" style={{ color: 'var(--bp-accent)' }} />
                    </div>
                    <h3 className="text-2xl font-semibold" style={{ color: 'var(--bp-text)' }}>Выберите услугу</h3>
                  </div>
                  <div className="space-y-4">
                    {services.map((service, i) => (
                      <div
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`bp-option-card ${selectedService === service.id ? 'bp-option-selected' : ''}`}
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-xl" style={{ color: 'var(--bp-text)' }}>{service.name}</p>
                            <p style={{ color: 'var(--bp-text-dim)' }}>{service.duration} мин</p>
                          </div>
                          <p className="font-semibold text-xl" style={{ color: 'var(--bp-accent)' }}>{service.price} ₽</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 'time' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bp-accent-10)' }}>
                      <Clock className="w-5 h-5" style={{ color: 'var(--bp-accent)' }} />
                    </div>
                    <h3 className="text-2xl font-semibold" style={{ color: 'var(--bp-text)' }}>Выберите время</h3>
                  </div>

                  {loadingSlots ? (
                    <p className="text-center py-8" style={{ color: 'var(--bp-text-faint)' }}>Проверяем занятость мастера...</p>
                  ) : fullDayBlocked || availableTimeSlots.length === 0 ? (
                    <div className="bp-warning-box">
                      <p className="font-medium" style={{ color: 'var(--bp-warning-text)' }}>
                        Мастер не работает в этот день
                      </p>
                      {fullDayReason && (
                        <p className="text-sm mt-1" style={{ color: 'var(--bp-warning-text)' }}>{fullDayReason}</p>
                      )}
                      <p className="text-sm mt-3" style={{ color: 'var(--bp-text-dim)' }}>
                        Выберите другую дату или мастера
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableTimeSlots.map((time, i) => {
                        const isUnavailable = blockedTimeSlots.has(time) || takenSlots.has(time);
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            disabled={isUnavailable}
                            className={`bp-time-slot ${isSelected ? 'bp-time-selected' : ''} ${isUnavailable ? 'bp-time-disabled' : ''}`}
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'client' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bp-accent-10)' }}>
                      <User className="w-5 h-5" style={{ color: 'var(--bp-accent)' }} />
                    </div>
                    <h3 className="text-2xl font-semibold" style={{ color: 'var(--bp-text)' }}>Ваши данные</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label style={{ color: 'var(--bp-text-dim)' }}>Имя и фамилия</Label>
                      <Input
                        placeholder="Анна Иванова"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="bp-input mt-2 h-14 rounded-2xl text-lg"
                      />
                    </div>
                    <div>
                      <Label style={{ color: 'var(--bp-text-dim)' }}>Телефон</Label>
                      <Input
                        placeholder="+7 (999) 123-45-67"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="bp-input mt-2 h-14 rounded-2xl text-lg"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting || !clientName.trim() || !clientPhone.trim()}
                    className="bp-submit-btn w-full h-16 text-xl font-semibold rounded-3xl"
                  >
                    {isSubmitting ? 'Записываем...' : 'Подтвердить запись'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}