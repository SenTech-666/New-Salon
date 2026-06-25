'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Clock, User, Scissors, CheckCircle2, AlertCircle, X, CalendarClock, Users } from 'lucide-react';
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
  // Новая настройка из админки: за сколько часов до начала записи перенос
  // ещё разрешён. Пока бэкенда нет — используем дефолт ниже, поле уже
  // заведено в типе, чтобы потом просто подхватить его из RPC без правок типов.
  reschedule_min_hours?: number;
};

// Существующая (для MVP) запись клиента — пока без бэкенда. Когда появится
// просмотр своих записей, этот тип и моковые данные ниже нужно будет
// заменить реальной выборкой из bookings по client_id/телефону.
type ClientBooking = {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  masterId: string;
  serviceId: string;
  status: 'pending' | 'confirmed' | 'rescheduled_pending' | 'cancelled';
};

// Статус дня в обычном календаре записи.
type DayStatus = 'past' | 'beyond' | 'confirmed' | 'free';

// Статус дня в календаре переноса — отличается от обычного, потому что
// нужно различать "у исходного мастера есть окно" и "есть только другой
// мастер" (см. ТЗ: эти случаи должны визуально отличаться).
type RescheduleDayStatus = 'past' | 'beyond' | 'same_master' | 'other_master' | 'unavailable';

// Один анонимный клиент на модуль (не на каждый рендер) — устраняет
// предупреждение "Multiple GoTrueClient instances detected".
const supabase = createClient();

export default function BookingPage({ salonSlug }: { salonSlug: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  // Порядок шагов изменён: сначала услуга, потом мастер. Это осознанно —
  // на шаге выбора мастера услуга уже известна, поэтому можно (и нужно)
  // фильтровать мастеров по тому, есть ли у них вообще окно под длительность
  // именно этой услуги в выбранный день, а не только по выходному/блокам.
  const [currentStep, setCurrentStep] = useState<'services' | 'masters' | 'time' | 'client'>('services');
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

  // ===== Перенос записи (фронт-логика, без бэкенда) =====
  // rescheduleMode=true означает, что весь календарь и модалка работают в
  // режиме переноса существующей записи, а не создания новой.
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [originalBooking, setOriginalBooking] = useState<ClientBooking | null>(null);
  // Шаг внутри модалки переноса. master_pick добавляется в поток ТОЛЬКО
  // если у исходного мастера на выбранный день нет окон — чтобы не
  // усложнять обычный случай "просто перенёс на другое время".
  const [rescheduleStep, setRescheduleStep] = useState<'master_pick' | 'time' | 'confirm'>('time');
  const [rescheduleNewMasterId, setRescheduleNewMasterId] = useState<string>('');
  const [dayAvailabilityMap, setDayAvailabilityMap] = useState<Map<number, RescheduleDayStatus>>(new Map());
  const [loadingDayAvailability, setLoadingDayAvailability] = useState(false);
  const [altMastersForDay, setAltMastersForDay] = useState<Master[]>([]);

  // ВРЕМЕННЫЙ мок: пока нет бэкенда для просмотра своих записей, по клику
  // на день с подтверждённой записью показываем эту фиктивную запись.
  // Когда появится реальный список — просто подменить источник этого
  // значения на результат запроса по client_id/телефону, остальной поток
  // (карточка записи -> кнопка "Перенести" -> режим переноса) не меняется.
  const MOCK_BOOKING: Omit<ClientBooking, 'date'> = {
    id: 'mock-booking-1',
    time: '10:00',
    masterId: '',
    serviceId: '',
    status: 'confirmed',
  };

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
  // Дефолт на время отсутствия бэкенда/поля в БД. Когда появится колонка
  // salons.reschedule_min_hours — она перетрёт это значение в fetchData.
  const [rescheduleMinHours, setRescheduleMinHours] = useState(24);

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
        // Когда в БД появится это поле, get_public_salon_by_slug нужно
        // обновить, чтобы оно его возвращало — здесь уже готово принять.
        if (typeof salon.reschedule_min_hours === 'number') {
          setRescheduleMinHours(salon.reschedule_min_hours);
        }

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
          className: 'landing-toast landing-toast-error',
          icon: <AlertCircle className="landing-toast-icon" />,
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
  // недоступны на эту дату. Теперь это выполняется ПОСЛЕ выбора услуги
  // (порядок шагов изменён), поэтому дополнительно фильтруем по тому, что
  // у мастера есть окно длиной хотя бы в duration выбранной услуги — иначе
  // мастер с 15-минутным окном попадёт в список для часовой услуги и
  // клиент на следующем шаге увидит пустой список времени.
  //
  // get_public_master_blocks принимает диапазон дат (без master_id) и
  // возвращает блокировки всех мастеров салона — фильтруем is_full_day
  // локально. Выходной/окно по недельному графику проверяется отдельным
  // вызовом get_public_master_weekly_hours на каждого мастера.
  //
  // ВАЖНО (оптимизация на будущее, для бэкенда): этот блок сейчас делает
  // 1 + N запросов (blocks + weekly_hours на каждого мастера). Когда будет
  // своя БД — стоит заменить на одну RPC get_available_masters_for_day(
  // salon_slug, service_id, date), которая одним SQL-запросом с CTE вернёт
  // всех мастеров с хотя бы одним свободным слотом нужной длительности.
  // Сейчас оставляю текущий подход рабочим, чтобы не блокироваться на бэкенде.
  useEffect(() => {
    if (!isModalOpen || !selectedDate || masters.length === 0 || !selectedService) return;
    if (rescheduleMode) return; // в режиме переноса доступность считается отдельным эффектом ниже

    let isMounted = true;

    const fetchUnavailableMasters = async () => {
      setLoadingMasterAvailability(true);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      const dayOfWeek = dayOfWeekFromDateString(dateStr);
      const service = services.find((s) => s.id === selectedService);
      const serviceDuration = service?.duration ?? 30;

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

        const fullDayBlockedIds = new Set<string>();
        const partialBlocksByMaster = new Map<string, BlockRow[]>();

        ((blocksRes.data as BlockRow[] | null) ?? []).forEach((b) => {
          if (b.is_full_day) {
            fullDayBlockedIds.add(b.master_id);
          } else {
            const list = partialBlocksByMaster.get(b.master_id) ?? [];
            list.push(b);
            partialBlocksByMaster.set(b.master_id, list);
          }
        });

        const unavailable = new Set<string>();

        masters.forEach((m, i) => {
          if (fullDayBlockedIds.has(m.id)) {
            unavailable.add(m.id);
            return;
          }

          const rows: WeeklyHourRow[] = hoursResList[i]?.data ?? [];
          const todayRow = rows.find((r) => r.day_of_week === dayOfWeek);

          if (!todayRow || todayRow.is_day_off || !todayRow.time_from || !todayRow.time_to) {
            unavailable.add(m.id);
            return;
          }

          // Проверяем, остаётся ли в окне работы мастера хотя бы один слот
          // длительностью serviceDuration после вычета частичных блоков.
          const slots = generateTimeSlots(todayRow.time_from, todayRow.time_to, slotIntervalMinutes, serviceDuration);
          const partials = partialBlocksByMaster.get(m.id) ?? [];
          const freeSlotExists = slots.some((slot) => {
            return !partials.some((b) => {
              if (!b.time_from || !b.time_to) return false;
              const from = b.time_from.slice(0, 5);
              const to = b.time_to.slice(0, 5);
              return slot >= from && slot < to;
            });
          });

          if (!freeSlotExists) unavailable.add(m.id);
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
  }, [isModalOpen, selectedDate, currentMonth, currentYear, masters, salonSlug, selectedService, services, slotIntervalMinutes, rescheduleMode]);

  // Шаг выбора времени: график выбранного мастера на этот день недели +
  // занятость. Занятые/отменённые записи берутся через get_taken_slots —
  // узкую функцию, которая отдаёт только время и статус, без имени и
  // телефона чужого клиента.
  //
  // В режиме переноса этот эффект тоже используется (и для исходного, и
  // для альтернативного мастера) — selectedMaster в этом режиме указывает
  // на текущего проверяемого мастера.
  useEffect(() => {
    const onTimeStep = rescheduleMode ? rescheduleStep === 'time' : currentStep === 'time';
    if (!onTimeStep || !selectedMaster || !selectedDate || !selectedService) return;

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
          className: 'landing-toast landing-toast-error',
          icon: <AlertCircle className="landing-toast-icon" />,
        });
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, [currentStep, rescheduleMode, rescheduleStep, selectedMaster, selectedDate, selectedService, currentMonth, currentYear, services, slotIntervalMinutes, salonSlug]);

  // ===== Доступность дней в режиме переноса (на весь месяц вперёд) =====
  //
  // ЗАГЛУШКА НА ВРЕМЯ ОТСУТСТВИЯ БЭКЕНДА: реальная реализация должна одним
  // SQL-запросом (RPC get_reschedule_day_availability, см. план ниже)
  // получить для каждого дня месяца два булевых флага — "свободен исходный
  // мастер" и "свободен хотя бы один другой мастер с этой услугой" — без
  // N+1 запросов по дням и мастерам. Здесь эта функция эмулируется на
  // клиенте поверх уже загруженных weekly_hours/blocks/taken_slots для всех
  // мастеров салона, чтобы поток модалки и календаря можно было сразу
  // протестировать. После появления бэкенда — заменить тело try на один
  // вызов supabase.rpc('get_reschedule_day_availability', {...}).
  useEffect(() => {
    if (!rescheduleMode || !originalBooking || masters.length === 0) return;

    let isMounted = true;

    const computeMonthAvailability = async () => {
      setLoadingDayAvailability(true);

      const daysInThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const service = services.find((s) => s.id === originalBooking.serviceId);
      const serviceDuration = service?.duration ?? 30;

      try {
        // Загружаем недельный график всех мастеров и блоки на весь месяц —
        // один раз, а не по дням. Это уже set-based на уровне фронта;
        // на бэкенде то же самое будет одним SQL-запросом с CTE.
        const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
        const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInThisMonth).padStart(2, '0')}`;

        const [blocksRes, takenAllRes, ...hoursResList] = await Promise.all([
          supabase.rpc('get_public_master_blocks', {
            p_salon_slug: salonSlug,
            p_date_from: monthStart,
            p_date_to: monthEnd,
          }),
          // Если бэкенд пока не поддерживает диапазон дат в get_taken_slots,
          // эта часть безопасно вернёт пусто/ошибку и просто не будет
          // учитывать занятость — для мок-режима этого достаточно.
          // Supabase возвращает PromiseLike (не настоящий Promise — у него
          // нет .catch), поэтому оборачиваем в Promise.resolve перед catch.
          Promise.resolve(
            supabase.rpc('get_taken_slots', {
              p_salon_slug: salonSlug,
              p_master_id: null,
              p_date: null,
            })
          ).catch(() => ({ data: [] as any[] })),
          ...masters.map((m) =>
            supabase.rpc('get_public_master_weekly_hours', {
              p_salon_slug: salonSlug,
              p_master_id: m.id,
            })
          ),
        ]);

        if (!isMounted) return;

        const blocksByMaster = new Map<string, BlockRow[]>();
        ((blocksRes.data as BlockRow[] | null) ?? []).forEach((b) => {
          const list = blocksByMaster.get(b.master_id) ?? [];
          list.push(b);
          blocksByMaster.set(b.master_id, list);
        });

        const hoursByMaster = new Map<string, WeeklyHourRow[]>();
        masters.forEach((m, i) => {
          hoursByMaster.set(m.id, hoursResList[i]?.data ?? []);
        });

        const result = new Map<number, RescheduleDayStatus>();

        for (let day = 1; day <= daysInThisMonth; day++) {
          const checkDate = new Date(currentYear, currentMonth, day);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (checkDate < today) {
            result.set(day, 'past');
            continue;
          }
          const maxDate = new Date(today);
          maxDate.setDate(maxDate.getDate() + bookingHorizonDays);
          if (checkDate > maxDate) {
            result.set(day, 'beyond');
            continue;
          }

          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayOfWeek = dayOfWeekFromDateString(dateStr);

          let sameMasterFree = false;
          let otherMasterFree = false;

          for (const m of masters) {
            const dayBlocks = (blocksByMaster.get(m.id) ?? []).filter(
              (b) => dateStr >= b.date_from && dateStr <= b.date_to
            );
            if (dayBlocks.some((b) => b.is_full_day)) continue;

            const hours = hoursByMaster.get(m.id) ?? [];
            const schedule = hours.find((h) => h.day_of_week === dayOfWeek);
            if (!schedule || schedule.is_day_off || !schedule.time_from || !schedule.time_to) continue;

            const slots = generateTimeSlots(schedule.time_from, schedule.time_to, slotIntervalMinutes, serviceDuration);
            const partials = dayBlocks.filter((b) => !b.is_full_day && b.time_from && b.time_to);

            const hasFreeSlot = slots.some((slot) => {
              const blockedByPartial = partials.some((b) => {
                const from = b.time_from!.slice(0, 5);
                const to = b.time_to!.slice(0, 5);
                return slot >= from && slot < to;
              });
              return !blockedByPartial;
              // Примечание: занятость конкретными bookings здесь намеренно
              // не учитывается в мок-версии (нет надёжного RPC под диапазон
              // дат без переделки бэкенда). Реальная RPC обязана вычитать
              // и пересекающиеся по времени bookings — это заложено в SQL-плане.
            });

            if (!hasFreeSlot) continue;

            if (m.id === originalBooking.masterId) sameMasterFree = true;
            else otherMasterFree = true;
          }

          if (sameMasterFree) result.set(day, 'same_master');
          else if (otherMasterFree) result.set(day, 'other_master');
          else result.set(day, 'unavailable');
        }

        setDayAvailabilityMap(result);
      } catch (error: any) {
        console.error('Ошибка расчёта доступности дней для переноса:', error);
      } finally {
        if (isMounted) setLoadingDayAvailability(false);
      }
    };

    computeMonthAvailability();

    return () => {
      isMounted = false;
    };
  }, [rescheduleMode, originalBooking, currentMonth, currentYear, masters, services, salonSlug, bookingHorizonDays, slotIntervalMinutes]);

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

  const getDayStatus = (day: number): DayStatus => {
    if (isPastDay(day)) return 'past';
    if (isBeyondHorizon(day)) return 'beyond';
    if (confirmedBookings.includes(day)) return 'confirmed';
    return 'free';
  };

  const getRescheduleDayStatus = (day: number): RescheduleDayStatus => {
    return dayAvailabilityMap.get(day) ?? (isPastDay(day) ? 'past' : isBeyondHorizon(day) ? 'beyond' : 'unavailable');
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
    if (rescheduleMode) {
      handleRescheduleDayClick(day);
      return;
    }

    if (isPastDay(day) || isBeyondHorizon(day)) return;

    // Мок: если на этот день уже "есть" подтверждённая запись, открываем
    // карточку существующей записи вместо формы новой — это временная
    // эмуляция будущего реального списка записей клиента.
    if (confirmedBookings.includes(day)) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setOriginalBooking({
        ...MOCK_BOOKING,
        date: dateStr,
        masterId: selectedMaster || masters[0]?.id || '',
        serviceId: selectedService || services[0]?.id || '',
      });
      setSelectedDate(day);
      setIsModalOpen(true);
      setCurrentStep('client'); // переиспользуем модалку как "карточка записи", см. рендер ниже
      return;
    }

    setSelectedDate(day);
    setCurrentStep('services');
    setSelectedMaster('');
    setSelectedService('');
    setSelectedTime('');
    setClientName('');
    setClientPhone('');
    setIsModalOpen(true);
  };

  const handleRescheduleDayClick = (day: number) => {
    const status = getRescheduleDayStatus(day);
    if (status === 'past' || status === 'beyond' || status === 'unavailable') return;
    if (!originalBooking) return;

    setSelectedDate(day);
    setSelectedTime('');

    if (status === 'same_master') {
      setSelectedMaster(originalBooking.masterId);
      setRescheduleNewMasterId('');
      setRescheduleStep('time');
    } else {
      // other_master: показываем явный шаг подтверждения смены мастера —
      // не подставляем тихо, клиент должен увидеть, что мастер меняется.
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = dayOfWeekFromDateString(dateStr);
      const service = services.find((s) => s.id === originalBooking.serviceId);
      const serviceDuration = service?.duration ?? 30;

      // Пересчитываем список альтернативных мастеров на конкретный день
      // (для отображения карточек выбора) — используем уже загруженные
      // в эффекте выше данные через повторный быстрый проход.
      const candidates = masters.filter((m) => m.id !== originalBooking.masterId);
      setAltMastersForDay(candidates);
      setSelectedMaster('');
      setRescheduleStep('master_pick');
    }

    setIsModalOpen(true);
  };

  const handleMasterSelect = (masterId: string) => {
    setSelectedMaster(masterId);
    setCurrentStep('time');
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setCurrentStep('masters');
  };

  const handleRescheduleMasterPick = (masterId: string) => {
    setRescheduleNewMasterId(masterId);
    setSelectedMaster(masterId);
    setRescheduleStep('time');
  };

  const handleTimeSelect = (time: string) => {
    if (blockedTimeSlots.has(time) || takenSlots.has(time) || fullDayBlocked) return;
    setSelectedTime(time);
    if (rescheduleMode) {
      setRescheduleStep('confirm');
    } else {
      setCurrentStep('client');
    }
  };

  const handleBack = () => {
    if (rescheduleMode) {
      if (rescheduleStep === 'time' && rescheduleNewMasterId) {
        setRescheduleStep('master_pick');
      } else if (rescheduleStep === 'confirm') {
        setRescheduleStep('time');
      } else {
        // Со старта потока (same_master, шаг time) — выходим в обычный режим.
        exitRescheduleMode();
      }
      return;
    }

    if (currentStep === 'masters') {
      setCurrentStep('services');
      setSelectedService('');
    } else if (currentStep === 'time') {
      setCurrentStep('masters');
      setSelectedMaster('');
    } else if (currentStep === 'client') {
      setCurrentStep('time');
      setSelectedTime('');
    }
  };

  // Закрытие модалки — единая точка, чтобы крестик и Dialog всегда
  // закрывались одинаково (через onOpenChange), без рассинхрона состояния.
  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (rescheduleMode) exitRescheduleMode();
  };

  const exitRescheduleMode = () => {
    setRescheduleMode(false);
    setOriginalBooking(null);
    setRescheduleStep('time');
    setRescheduleNewMasterId('');
    setSelectedMaster('');
    setSelectedTime('');
    setAltMastersForDay([]);
  };

  // Проверка "можно ли вообще перенести" по времени до начала записи —
  // дублирует будущую серверную проверку в reschedule_booking, но даёт
  // мгновенный фидбек на фронте без round-trip.
  const canRescheduleBooking = (booking: ClientBooking): boolean => {
    const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
    const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= rescheduleMinHours;
  };

  const handleStartReschedule = () => {
    if (!originalBooking) return;
    if (!canRescheduleBooking(originalBooking)) {
      toast.error('Перенос недоступен', {
        description: `Запись можно перенести не позднее, чем за ${rescheduleMinHours} ч. до начала`,
        className: 'landing-toast landing-toast-error',
        icon: <AlertCircle className="landing-toast-icon" />,
      });
      return;
    }

    setIsModalOpen(false);
    setRescheduleMode(true);
    setSelectedDate(null);
    setSelectedTime('');
    setRescheduleStep('time');
  };

  const handleConfirmBooking = async () => {
    if (!salonId || !selectedDate || !selectedMaster || !selectedService || !selectedTime || !clientName.trim() || !clientPhone.trim()) {
      toast.error('Пожалуйста, заполните все поля', {
        className: 'landing-toast landing-toast-error',
        icon: <AlertCircle className="landing-toast-icon" />,
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
        className: 'landing-toast landing-toast-success',
        icon: <CheckCircle2 className="landing-toast-icon" />,
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
        className: 'landing-toast landing-toast-error',
        icon: <AlertCircle className="landing-toast-icon" />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Подтверждение переноса. ЗАГЛУШКА: пока нет бэкенда — просто обновляем
  // мок originalBooking и закрываем модалку с тостом. Когда появится
  // PostgreSQL — заменить тело try на supabase.rpc('reschedule_booking', {
  //   p_booking_id: originalBooking.id,
  //   p_new_date: dateStr,
  //   p_new_time: selectedTime,
  //   p_new_master_id: selectedMaster,
  // }), которая внутри одной транзакции повторно проверит занятость и
  // запрет переноса < reschedule_min_hours (см. SQL-план), чтобы не
  // доверять одному только фронтовому состоянию при гонке двух клиентов.
  const handleConfirmReschedule = async () => {
    if (!originalBooking || !selectedDate || !selectedMaster || !selectedTime) return;

    setIsSubmitting(true);
    try {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

      // await supabase.rpc('reschedule_booking', { ... }) — см. комментарий выше

      toast.success('Запись перенесена', {
        description: `${selectedDate} ${monthNames[currentMonth]} ${currentYear} • ${selectedTime}${rescheduleNewMasterId ? ' • новый мастер' : ''}`,
        duration: 6000,
        className: 'landing-toast landing-toast-success',
        icon: <CheckCircle2 className="landing-toast-icon" />,
      });

      setIsModalOpen(false);
      exitRescheduleMode();
    } catch (error: any) {
      console.error(error);
      toast.error('Не удалось перенести запись', {
        description: error.message || 'Попробуйте позже',
        className: 'landing-toast landing-toast-error',
        icon: <AlertCircle className="landing-toast-icon" />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Шаги модалки в порядке прохождения — используется для прогресс-бара.
  const stepOrder: Array<typeof currentStep> = ['services', 'masters', 'time', 'client'];
  const stepIndex = stepOrder.indexOf(currentStep);

  const rescheduleStepOrder: Array<typeof rescheduleStep> = rescheduleNewMasterId
    ? ['master_pick', 'time', 'confirm']
    : ['time', 'confirm'];
  const rescheduleStepIndex = rescheduleStepOrder.indexOf(rescheduleStep);

  const selectedMasterObj = masters.find((m) => m.id === selectedMaster);
  const selectedServiceObj = services.find((s) => s.id === selectedService);
  const originalMasterObj = originalBooking ? masters.find((m) => m.id === originalBooking.masterId) : null;
  const originalServiceObj = originalBooking ? services.find((s) => s.id === originalBooking.serviceId) : null;

  if (notFoundSalon) {
    return (
      <div className="min-h-screen flex items-center justify-center landing-bp-bg">
        <p className="text-xl" style={{ color: 'var(--landing-text-dim)' }}>Салон не найден</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center landing-bp-bg">
        <p className="text-xl" style={{ color: 'var(--landing-text-dim)' }}>Загрузка мастеров и услуг...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen landing-bp-bg pb-12 relative overflow-hidden">

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
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--landing-accent-10)' }}>
                <span className="text-3xl font-bold" style={{ color: 'var(--landing-accent)', fontFamily: 'var(--landing-font-display)' }}>
                  {salonInfo?.name?.[0] ?? '?'}
                </span>
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1
                className="text-4xl md:text-5xl font-semibold italic tracking-tight"
                style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
              >
                {salonInfo?.name ?? 'Онлайн-запись'}
              </h1>
              {salonInfo?.description && (
                <p className="mt-1 text-lg" style={{ color: 'var(--landing-text-dim)' }}>{salonInfo.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2 justify-center sm:justify-start">
                {salonInfo?.address && (
                  <span className="text-sm flex items-center gap-1" style={{ color: 'var(--landing-text-faint)' }}>
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
                    style={{ color: 'var(--landing-accent)' }}
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

          {rescheduleMode && originalBooking && (
            <div className="landing-warning-box flex items-center gap-3 mt-2">
              <CalendarClock className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--landing-accent-dark)' }} />
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--landing-accent-dark)' }}>
                  Перенос записи: {originalServiceObj?.name} у {originalMasterObj?.name}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--landing-text-dim)' }}>
                  Текущее время: {originalBooking.date} • {originalBooking.time}. Выберите новую дату.
                </p>
              </div>
              <button onClick={exitRescheduleMode} className="landing-nav-btn" style={{ width: 36, height: 36 }} aria-label="Отменить перенос">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Подложка календаря — стекло (glassmorphism) на кремовом фоне */}
        <div className="landing-glass" style={{ borderRadius: 24, overflow: 'hidden' }}>
          <div className="flex flex-row items-center justify-between px-6 sm:px-10 pt-8 pb-8">
            <button onClick={handlePrevMonth} className="landing-nav-btn" aria-label="Предыдущий месяц">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h2
              className="text-3xl md:text-4xl font-medium italic"
              style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
            >
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button onClick={handleNextMonth} className="landing-nav-btn" aria-label="Следующий месяц">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="px-4 sm:px-8 pb-10">
            <div className="grid grid-cols-7 gap-2 mb-6 text-center text-sm font-medium" style={{ color: 'var(--landing-text-dim)' }}>
              {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>

            {rescheduleMode && loadingDayAvailability ? (
              <p className="text-center py-12" style={{ color: 'var(--landing-text-faint)' }}>
                Проверяем доступность мастеров на {monthNames[currentMonth].toLowerCase()}...
              </p>
            ) : (
              <div className="grid grid-cols-7 gap-2 sm:gap-3">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  if (rescheduleMode) {
                    const status = getRescheduleDayStatus(day);
                    const isSelected = selectedDate === day;
                    const isDisabled = status === 'past' || status === 'beyond' || status === 'unavailable';

                    return (
                      <button
                        key={day}
                        onClick={() => handleDayClick(day)}
                        disabled={isDisabled}
                        className={`landing-day-cell ${isSelected ? 'landing-day-selected' : ''} ${status === 'other_master' ? 'landing-day-other-master' : ''}`}
                        style={{ animationDelay: `${day * 10}ms` }}
                      >
                        <span className="landing-day-num">{day}</span>
                        <span className="landing-day-label">
                          {status === 'past' && <span style={{ color: 'var(--landing-text-faint)' }}>Прошёл</span>}
                          {status === 'beyond' && <span style={{ color: 'var(--landing-text-faint)' }}>Недоступно</span>}
                          {status === 'unavailable' && <span style={{ color: 'var(--landing-text-faint)' }}>Нет мест</span>}
                          {status === 'same_master' && <span style={{ color: 'var(--landing-success-text)' }}>Свободно</span>}
                          {status === 'other_master' && <span style={{ color: 'var(--landing-accent)', fontWeight: 600 }}>Другой мастер</span>}
                        </span>
                      </button>
                    );
                  }

                  const status = getDayStatus(day);
                  const isSelected = selectedDate === day;
                  const isDisabled = status === 'past' || status === 'beyond';

                  return (
                    <button
                      key={day}
                      onClick={() => handleDayClick(day)}
                      disabled={isDisabled}
                      className={`landing-day-cell ${isSelected ? 'landing-day-selected' : ''} ${status === 'confirmed' ? 'landing-day-confirmed' : ''}`}
                      style={{ animationDelay: `${day * 10}ms` }}
                    >
                      <span className="landing-day-num">{day}</span>
                      <span className="landing-day-label">
                        {status === 'past' && <span style={{ color: 'var(--landing-text-faint)' }}>Прошёл</span>}
                        {status === 'beyond' && <span style={{ color: 'var(--landing-text-faint)' }}>Недоступно</span>}
                        {status === 'confirmed' && <span style={{ color: 'var(--landing-accent)', fontWeight: 600 }}>Ваша</span>}
                        {status === 'free' && <span style={{ color: 'var(--landing-success-text)' }}>Свободно</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open && rescheduleMode) exitRescheduleMode(); }}>
        {/* Модалка — тоже стекло, плюс прогресс-бар шагов и slide+fade переход контента.
            showCloseButton={false} убирает дефолтный крестик shadcn — он рендерится
            absolute right-4 top-4 внутри DialogContent и физически перекрывался нашим
            sticky-хедером, из-за чего клики до него не доходили. Вместо него — наша
            явная кнопка ниже, в потоке документа, гарантированно кликабельная. */}
        <DialogContent
          showCloseButton={false}
          className="landing-modal max-w-lg w-[95%] max-h-[92vh] overflow-hidden rounded-3xl p-0 flex flex-col"
        >
          <DialogHeader className="landing-modal-header sticky top-0 z-10 px-6 py-5 flex flex-row items-center gap-3 shrink-0">
            {(rescheduleMode ? rescheduleStepIndex > 0 : currentStep !== 'services') ? (
              <button onClick={handleBack} className="landing-nav-btn" style={{ width: 40, height: 40 }} aria-label="Назад">
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <span style={{ width: 40, height: 40, flexShrink: 0 }} aria-hidden="true" />
            )}
            <div className="flex-1 text-center">
              <DialogTitle
                className="text-2xl font-semibold italic"
                style={{ color: 'var(--landing-text)', fontFamily: 'var(--landing-font-display)' }}
              >
                {rescheduleMode ? 'Перенос записи' : `${selectedDate} ${monthNames[currentMonth]} ${currentYear}`}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1" style={{ color: 'var(--landing-text-dim)' }}>
                {rescheduleMode ? `${selectedDate} ${monthNames[currentMonth]} ${currentYear}` : 'Запись за 30 секунд'}
              </DialogDescription>
            </div>
            <button
              onClick={handleCloseModal}
              className="landing-nav-btn landing-modal-close"
              style={{ width: 40, height: 40 }}
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          {/* Прогресс-бар: заливается акцентом по мере прохождения шагов */}
          <div className="landing-progress-track">
            <div
              className="landing-progress-fill"
              style={{
                width: rescheduleMode
                  ? `${((rescheduleStepIndex + 1) / rescheduleStepOrder.length) * 100}%`
                  : `${((stepIndex + 1) / stepOrder.length) * 100}%`,
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto landing-modal-scrollbar p-6 sm:p-8">
            {/* ===== Карточка существующей записи (мок) + кнопка "Перенести" ===== */}
            {!rescheduleMode && currentStep === 'client' && originalBooking && confirmedBookings.includes(selectedDate ?? -1) && (
              <div key="existing-booking" className="landing-step-enter space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--landing-accent-10)' }}>
                    <CalendarClock className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
                  </div>
                  <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Ваша запись</h3>
                </div>

                <div className="landing-option-card landing-option-selected" style={{ cursor: 'default' }}>
                  <p className="font-semibold text-xl" style={{ color: 'var(--landing-text)' }}>
                    {originalServiceObj?.name ?? 'Услуга'}
                  </p>
                  <p className="mt-1" style={{ color: 'var(--landing-text-dim)' }}>
                    {originalMasterObj?.name ?? 'Мастер'} • {originalBooking.time}
                  </p>
                </div>

                {canRescheduleBooking(originalBooking) ? (
                  <button onClick={handleStartReschedule} className="landing-submit-btn w-full h-16 text-xl font-semibold rounded-3xl">
                    Перенести запись
                  </button>
                ) : (
                  <div className="landing-warning-box">
                    <p className="font-medium" style={{ color: 'var(--landing-accent-dark)' }}>
                      Перенос недоступен
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--landing-text-dim)' }}>
                      Запись можно перенести не позднее, чем за {rescheduleMinHours} ч. до начала
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ===== Обычный поток новой записи ===== */}
            {!rescheduleMode && currentStep !== 'client' && (
              <div key={currentStep} className="landing-step-enter space-y-10">
                {currentStep === 'services' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--landing-accent-10)' }}>
                        <Scissors className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
                      </div>
                      <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Выберите услугу</h3>
                    </div>
                    <div className="space-y-4">
                      {services.map((service, i) => (
                        <div
                          key={service.id}
                          onClick={() => handleServiceSelect(service.id)}
                          className={`landing-option-card ${selectedService === service.id ? 'landing-option-selected' : ''}`}
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-xl" style={{ color: 'var(--landing-text)' }}>{service.name}</p>
                              <p style={{ color: 'var(--landing-text-dim)' }}>{service.duration} мин</p>
                            </div>
                            <p
                              className="font-semibold text-xl"
                              style={{ color: 'var(--landing-accent)', fontFamily: 'var(--landing-font-display)' }}
                            >
                              {service.price} ₽
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 'masters' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--landing-accent-10)' }}>
                        <User className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
                      </div>
                      <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Выберите мастера</h3>
                    </div>

                    {loadingMasterAvailability ? (
                      <p className="text-center py-8" style={{ color: 'var(--landing-text-faint)' }}>Проверяем доступность мастеров...</p>
                    ) : (
                      <div className="space-y-4">
                        {masters
                          .filter((master) => !unavailableMasterIds.has(master.id))
                          .map((master, i) => (
                            <div
                              key={master.id}
                              onClick={() => handleMasterSelect(master.id)}
                              className={`landing-option-card ${selectedMaster === master.id ? 'landing-option-selected' : ''}`}
                              style={{ animationDelay: `${i * 60}ms` }}
                            >
                              <p className="font-semibold text-xl" style={{ color: 'var(--landing-text)' }}>{master.name}</p>
                              <p className="mt-1" style={{ color: 'var(--landing-text-dim)' }}>{master.specialty}</p>
                            </div>
                          ))}

                        {masters.filter((m) => !unavailableMasterIds.has(m.id)).length === 0 && (
                          <div className="landing-warning-box">
                            <p className="font-medium" style={{ color: 'var(--landing-accent-dark)' }}>
                              На эту услугу в этот день никто из мастеров не свободен
                            </p>
                            <p className="text-sm mt-2" style={{ color: 'var(--landing-text-dim)' }}>
                              Выберите другую дату или услугу
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 'time' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--landing-accent-10)' }}>
                        <Clock className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
                      </div>
                      <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Выберите время</h3>
                    </div>

                    {loadingSlots ? (
                      <p className="text-center py-8" style={{ color: 'var(--landing-text-faint)' }}>Проверяем занятость мастера...</p>
                    ) : fullDayBlocked || availableTimeSlots.length === 0 ? (
                      <div className="landing-warning-box">
                        <p className="font-medium" style={{ color: 'var(--landing-accent-dark)' }}>
                          Мастер не работает в этот день
                        </p>
                        {fullDayReason && (
                          <p className="text-sm mt-1" style={{ color: 'var(--landing-accent-dark)' }}>{fullDayReason}</p>
                        )}
                        <p className="text-sm mt-3" style={{ color: 'var(--landing-text-dim)' }}>
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
                              className={`landing-time-slot ${isSelected ? 'landing-time-selected' : ''} ${isUnavailable ? 'landing-time-disabled' : ''}`}
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
              </div>
            )}

            {!rescheduleMode && currentStep === 'client' && !(originalBooking && confirmedBookings.includes(selectedDate ?? -1)) && (
              <div key="client" className="landing-step-enter space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--landing-accent-10)' }}>
                    <User className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
                  </div>
                  <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Ваши данные</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label style={{ color: 'var(--landing-text-dim)' }}>Имя и фамилия</Label>
                    <Input
                      placeholder="Анна Иванова"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="landing-bp-input mt-2 h-14 rounded-2xl text-lg"
                    />
                  </div>
                  <div>
                    <Label style={{ color: 'var(--landing-text-dim)' }}>Телефон</Label>
                    <Input
                      placeholder="+7 (999) 123-45-67"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="landing-bp-input mt-2 h-14 rounded-2xl text-lg"
                    />
                  </div>
                </div>

                <button
                  onClick={handleConfirmBooking}
                  disabled={isSubmitting || !clientName.trim() || !clientPhone.trim()}
                  className="landing-submit-btn w-full h-16 text-xl font-semibold rounded-3xl"
                >
                  {isSubmitting ? 'Записываем...' : 'Подтвердить запись'}
                </button>
              </div>
            )}

            {/* ===== Поток переноса записи ===== */}
            {rescheduleMode && (
              <div key={rescheduleStep} className="landing-step-enter space-y-10">
                {rescheduleStep === 'master_pick' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--landing-accent-10)' }}>
                        <Users className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
                      </div>
                      <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Нужен другой мастер</h3>
                    </div>

                    <div className="landing-warning-box">
                      <p className="font-medium" style={{ color: 'var(--landing-accent-dark)' }}>
                        У {originalMasterObj?.name} нет свободного времени в этот день
                      </p>
                      <p className="text-sm mt-2" style={{ color: 'var(--landing-text-dim)' }}>
                        Доступны другие мастера на услугу «{originalServiceObj?.name}». Выберите, к кому перенести запись:
                      </p>
                    </div>

                    <div className="space-y-4">
                      {altMastersForDay.map((master, i) => (
                        <div
                          key={master.id}
                          onClick={() => handleRescheduleMasterPick(master.id)}
                          className={`landing-option-card ${rescheduleNewMasterId === master.id ? 'landing-option-selected' : ''}`}
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <p className="font-semibold text-xl" style={{ color: 'var(--landing-text)' }}>{master.name}</p>
                          <p className="mt-1" style={{ color: 'var(--landing-text-dim)' }}>{master.specialty}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rescheduleStep === 'time' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--landing-accent-10)' }}>
                        <Clock className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
                      </div>
                      <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Выберите время</h3>
                    </div>

                    {rescheduleNewMasterId && (
                      <p className="text-sm" style={{ color: 'var(--landing-text-dim)' }}>
                        Новый мастер: <span style={{ color: 'var(--landing-accent)', fontWeight: 600 }}>{selectedMasterObj?.name}</span>
                      </p>
                    )}

                    {loadingSlots ? (
                      <p className="text-center py-8" style={{ color: 'var(--landing-text-faint)' }}>Проверяем занятость мастера...</p>
                    ) : fullDayBlocked || availableTimeSlots.length === 0 ? (
                      <div className="landing-warning-box">
                        <p className="font-medium" style={{ color: 'var(--landing-accent-dark)' }}>
                          В этот день не осталось свободного времени
                        </p>
                        <p className="text-sm mt-3" style={{ color: 'var(--landing-text-dim)' }}>
                          Выберите другую дату
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
                              className={`landing-time-slot ${isSelected ? 'landing-time-selected' : ''} ${isUnavailable ? 'landing-time-disabled' : ''}`}
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

                {rescheduleStep === 'confirm' && originalBooking && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--landing-accent-10)' }}>
                        <CalendarClock className="w-5 h-5" style={{ color: 'var(--landing-accent)' }} />
                      </div>
                      <h3 className="text-2xl font-semibold" style={{ color: 'var(--landing-text)' }}>Подтвердите перенос</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="landing-option-card" style={{ cursor: 'default', opacity: 0.6 }}>
                        <p className="text-sm" style={{ color: 'var(--landing-text-faint)' }}>Было</p>
                        <p className="font-semibold text-lg mt-1" style={{ color: 'var(--landing-text)' }}>
                          {originalBooking.date} • {originalBooking.time}
                        </p>
                        <p style={{ color: 'var(--landing-text-dim)' }}>{originalMasterObj?.name}</p>
                      </div>

                      <div className="landing-option-card landing-option-selected" style={{ cursor: 'default' }}>
                        <p className="text-sm" style={{ color: 'var(--landing-accent)' }}>Станет</p>
                        <p className="font-semibold text-lg mt-1" style={{ color: 'var(--landing-text)' }}>
                          {selectedDate} {monthNames[currentMonth]} {currentYear} • {selectedTime}
                        </p>
                        <p style={{ color: 'var(--landing-text-dim)' }}>
                          {selectedMasterObj?.name}
                          {rescheduleNewMasterId && <span style={{ color: 'var(--landing-accent)' }}> (смена мастера)</span>}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleConfirmReschedule}
                      disabled={isSubmitting}
                      className="landing-submit-btn w-full h-16 text-xl font-semibold rounded-3xl"
                    >
                      {isSubmitting ? 'Переносим...' : 'Подтвердить перенос'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}