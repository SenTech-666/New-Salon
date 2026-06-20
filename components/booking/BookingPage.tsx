'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Clock, User, Scissors } from 'lucide-react';
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

export default function BookingPage() {
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

  // Шаг сетки времени (минуты), задаётся владельцем салона в настройках.
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(30);

  // Слоты времени, сгенерированные по графику мастера на выбранный день
  // недели + длительности выбранной услуги. Пустой массив = рабочих часов
  // на этот день вообще нет (выходной по графику ИЛИ занятие не успевает
  // закончиться до закрытия).
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  // Занятость на выбранную дату/мастера: отдельно блокировки по времени,
  // отдельно — полный день (отпуск/больничный), отдельно — уже занятые
  // слоты из существующих записей.
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<Set<string>>(new Set());
  const [fullDayBlocked, setFullDayBlocked] = useState(false);
  const [fullDayReason, setFullDayReason] = useState<string | null>(null);
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Мастера, которые недоступны на выбранную дату — либо у них весь день
  // заблокирован (отпуск/больничный), либо по графику в этот день недели
  // выходной. Такие мастера не показываются в списке выбора мастера.
  const [unavailableMasterIds, setUnavailableMasterIds] = useState<Set<string>>(new Set());
  const [loadingMasterAvailability, setLoadingMasterAvailability] = useState(false);

  // Горизонт записи — на сколько дней вперёд клиент может бронировать.
  // Задаётся владельцем салона в админке (таблица salon_settings).
  const [bookingHorizonDays, setBookingHorizonDays] = useState(30);

  const supabase = createClient();

  const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [mastersRes, servicesRes, settingsRes] = await Promise.all([
          supabase.from('masters').select('*').eq('is_active', true).order('name'),
          supabase.from('services').select('*').eq('is_active', true).order('name'),
          supabase.from('salon_settings').select('booking_horizon_days, slot_interval_minutes').eq('id', 1).single(),
        ]);

        if (!isMounted) return;

        const uniqueMasters = mastersRes.data
          ? Array.from(new Map(mastersRes.data.map((item: Master) => [item.id, item]))).map(([, v]) => v)
          : [];

        const uniqueServices = servicesRes.data
          ? Array.from(new Map(servicesRes.data.map((item: Service) => [item.id, item]))).map(([, v]) => v)
          : [];

        setMasters(uniqueMasters);
        setServices(uniqueServices);

        if (settingsRes.data?.booking_horizon_days) {
          setBookingHorizonDays(settingsRes.data.booking_horizon_days);
        }
        if (settingsRes.data?.slot_interval_minutes) {
          setSlotIntervalMinutes(settingsRes.data.slot_interval_minutes);
        }

      } catch (error: any) {
        console.error('Ошибка загрузки мастеров:', error);
        toast.error('Не удалось загрузить мастеров');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // При открытии модалки (выбрана дата) подгружаем, какие мастера
  // недоступны на эту дату — либо полная блокировка (отпуск/больничный),
  // либо выходной день по их недельному графику.
  useEffect(() => {
    if (!isModalOpen || !selectedDate) return;

    let isMounted = true;

    const fetchUnavailableMasters = async () => {
      setLoadingMasterAvailability(true);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;
      const dayOfWeek = dayOfWeekFromDateString(dateStr);

      try {
        const [blocksRes, hoursRes] = await Promise.all([
          supabase
            .from('master_blocks')
            .select('master_id')
            .eq('is_full_day', true)
            .lte('date_from', dateStr)
            .gte('date_to', dateStr),
          supabase
            .from('master_weekly_hours')
            .select('master_id')
            .eq('day_of_week', dayOfWeek)
            .eq('is_day_off', true),
        ]);

        if (!isMounted) return;

        const unavailable = new Set<string>();
        (blocksRes.data ?? []).forEach((b: any) => unavailable.add(b.master_id));
        (hoursRes.data ?? []).forEach((h: any) => unavailable.add(h.master_id));

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
  }, [isModalOpen, selectedDate, currentMonth, currentYear, supabase]);

  // Подгружаем график мастера на выбранный день недели + занятость
  // (блокировки по времени и существующие записи), когда доходим до шага
  // выбора времени — в этот момент уже известны мастер, дата и услуга
  // (длительность услуги нужна, чтобы не предложить слот, не успевающий
  // закончиться до закрытия).
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
        const [hoursRes, blocksRes, bookingsRes] = await Promise.all([
          supabase
            .from('master_weekly_hours')
            .select('*')
            .eq('master_id', selectedMaster)
            .eq('day_of_week', dayOfWeek)
            .maybeSingle(),
          supabase
            .from('master_blocks')
            .select('*')
            .eq('master_id', selectedMaster)
            .lte('date_from', dateStr)
            .gte('date_to', dateStr),
          supabase
            .from('bookings')
            .select('time, status')
            .eq('master_id', selectedMaster)
            .eq('date', dateStr)
            .neq('status', 'cancelled'),
        ]);

        if (!isMounted) return;

        const schedule = hoursRes.data;

        // Нет графика на этот день вообще или явный выходной — слотов нет.
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

        (blocksRes.data ?? []).forEach((b: any) => {
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
          (bookingsRes.data ?? []).map((b: any) => b.time.slice(0, 5))
        );

        setAvailableTimeSlots(slots);
        setBlockedTimeSlots(blocked);
        setFullDayBlocked(isFullDay);
        setFullDayReason(reason);
        setTakenSlots(taken);
      } catch (error: any) {
        console.error('Ошибка загрузки занятости:', error);
        toast.error('Не удалось проверить занятость мастера');
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchAvailability();

    return () => {
      isMounted = false;
    };
  }, [currentStep, selectedMaster, selectedDate, selectedService, currentMonth, currentYear, services, slotIntervalMinutes, supabase]);

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
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
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

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedMaster || !selectedService || !selectedTime || !clientName.trim() || !clientPhone.trim()) {
      toast.error("Пожалуйста, заполните все поля");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('bookings').insert({
        date: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`,
        time: selectedTime,
        master_id: selectedMaster,
        service_id: selectedService,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        status: 'pending'
      });

      if (error) throw error;

      setConfirmedBookings(prev => [...prev, selectedDate]);
      setIsModalOpen(false);

      toast.success('Запись успешно создана!', {
        description: `${selectedDate} ${monthNames[currentMonth]} ${currentYear} • ${selectedTime}`,
        duration: 6000,
      });

      setSelectedMaster('');
      setSelectedService('');
      setSelectedTime('');
      setClientName('');
      setClientPhone('');
    } catch (error: any) {
      console.error(error);
      toast.error('Ошибка при записи', { description: error.message || 'Попробуйте позже' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ede4d9]">
        <p className="text-xl text-slate-600">Загрузка мастеров и услуг...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ede4d9] pb-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#c9a08a]/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#c9a08a]/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative">
        <div className="text-center pt-12 pb-10">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-slate-900 mb-3">Онлайн-запись</h1>
          <p className="text-xl text-slate-600">Выберите удобный день и время</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-8 px-6 sm:px-10 pt-8">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-11 w-11 rounded-full">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <CardTitle className="text-3xl md:text-4xl font-semibold text-slate-900">
              {monthNames[currentMonth]} {currentYear}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-11 w-11 rounded-full">
              <ChevronRight className="h-6 w-6" />
            </Button>
          </CardHeader>

          <CardContent className="px-4 sm:px-8 pb-10">
            <div className="grid grid-cols-7 gap-2 mb-6 text-center text-sm font-medium text-slate-500">
              {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map(d => <div key={d} className="py-1">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const { status } = getDayStatus(day);
                const isSelected = selectedDate === day;

                return (
                  <div
                    key={day}
                    onClick={() => handleDayClick(day)}
                    className={`aspect-square rounded-3xl border flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 hover:shadow-xl bg-white
                      ${status === 'past' || status === 'beyond' ? 'opacity-40 cursor-not-allowed' : 'hover:border-slate-200'}
                      ${isSelected ? 'border-[#c9a08a] shadow-lg scale-[1.02]' : 'border-slate-100'}
                    `}
                  >
                    <span className="text-3xl sm:text-4xl font-semibold text-slate-800">{day}</span>
                    <span className="hidden sm:block text-[10px] font-medium mt-1 tracking-wide">
                      {status === 'past' && <span className="text-slate-400">Прошёл</span>}
                      {status === 'beyond' && <span className="text-slate-400">Недоступно</span>}
                      {status === 'confirmed' && <span className="text-[#c9a08a] font-semibold">Ваша</span>}
                      {status === 'free' && <span className="text-emerald-600">Свободно</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg w-[95%] max-h-[92vh] overflow-hidden rounded-3xl p-0 bg-[#fdf7f0] border border-[#c9a08a]/20 flex flex-col">
          <DialogHeader className="sticky top-0 bg-[#fdf7f0]/95 backdrop-blur-lg z-10 border-b border-[#c9a08a]/10 px-6 py-5 flex flex-row items-center gap-3 shrink-0">
            {currentStep !== 'masters' && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-10 w-10 rounded-full">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1 text-center">
              <DialogTitle className="text-2xl font-semibold text-slate-900">
                {selectedDate} {monthNames[currentMonth]} {currentYear}
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-sm mt-1">
                Запись за 30 секунд
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto modal-scrollbar p-6 sm:p-8">
            <div className="space-y-10">
              {currentStep === 'masters' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#c9a08a]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#c9a08a]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900">Выберите мастера</h3>
                  </div>

                  {loadingMasterAvailability ? (
                    <p className="text-center text-slate-400 py-8">Проверяем доступность мастеров...</p>
                  ) : (
                    <div className="space-y-4">
                      {masters
                        .filter((master) => !unavailableMasterIds.has(master.id))
                        .map((master) => (
                          <div
                            key={master.id}
                            onClick={() => handleMasterSelect(master.id)}
                            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer hover:shadow-xl bg-white
                              ${selectedMaster === master.id ? 'border-[#c9a08a] bg-[#c9a08a]/5 shadow' : 'border-slate-100 hover:border-slate-200'}`}
                          >
                            <p className="font-semibold text-xl">{master.name}</p>
                            <p className="text-slate-500 mt-1">{master.specialty}</p>
                          </div>
                        ))}

                      {masters.filter((m) => !unavailableMasterIds.has(m.id)).length === 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
                          <p className="text-amber-700 font-medium">
                            В этот день никто из мастеров не работает
                          </p>
                          <p className="text-slate-500 text-sm mt-2">
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
                    <div className="w-10 h-10 rounded-2xl bg-[#c9a08a]/10 flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-[#c9a08a]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900">Выберите услугу</h3>
                  </div>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => handleServiceSelect(service.id)}
                        className={`p-6 rounded-3xl border-2 transition-all cursor-pointer hover:shadow-xl bg-white
                          ${selectedService === service.id ? 'border-[#c9a08a] bg-[#c9a08a]/5 shadow' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-xl">{service.name}</p>
                            <p className="text-slate-500">{service.duration} мин</p>
                          </div>
                          <p className="font-semibold text-xl text-[#c9a08a]">{service.price} ₽</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 'time' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#c9a08a]/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#c9a08a]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900">Выберите время</h3>
                  </div>

                  {loadingSlots ? (
                    <p className="text-center text-slate-400 py-8">Проверяем занятость мастера...</p>
                  ) : fullDayBlocked || availableTimeSlots.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
                      <p className="text-amber-700 font-medium">
                        Мастер не работает в этот день
                      </p>
                      {fullDayReason && (
                        <p className="text-amber-600 text-sm mt-1">{fullDayReason}</p>
                      )}
                      <p className="text-slate-500 text-sm mt-3">
                        Выберите другую дату или мастера
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {availableTimeSlots.map((time) => {
                        const isUnavailable = blockedTimeSlots.has(time) || takenSlots.has(time);
                        return (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            onClick={() => handleTimeSelect(time)}
                            disabled={isUnavailable}
                            className={`h-16 text-base font-medium rounded-2xl transition-all ${
                              selectedTime === time ? 'bg-[#c9a08a] hover:bg-[#b38f79]' : ''
                            } ${
                              isUnavailable
                                ? 'cursor-not-allowed border-red-200 bg-red-100 text-red-300 hover:bg-red-100 hover:text-red-300'
                                : ''
                            }`}
                          >
                            {time}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'client' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#c9a08a]/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#c9a08a]" />
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900">Ваши данные</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-slate-600">Имя и фамилия</Label>
                      <Input
                        placeholder="Анна Иванова"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="mt-2 h-14 rounded-2xl text-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-600">Телефон</Label>
                      <Input
                        placeholder="+7 (999) 123-45-67"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="mt-2 h-14 rounded-2xl text-lg"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting || !clientName.trim() || !clientPhone.trim()}
                    className="w-full h-16 text-xl font-semibold rounded-3xl bg-[#c9a08a] hover:bg-[#b38f79] shadow-xl transition-all active:scale-[0.985]"
                  >
                    {isSubmitting ? 'Записываем...' : 'Подтвердить запись'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}