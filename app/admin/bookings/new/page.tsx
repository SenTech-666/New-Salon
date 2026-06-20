'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Master = { id: string; name: string; specialty: string | null };
type Service = { id: string; name: string; duration: number; price: number };

const TIMES = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00',
];

export default function NewBookingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [masters, setMasters] = useState<Master[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    master_id: '',
    service_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    client_name: '',
    client_phone: '',
    status: 'confirmed',
    notes: '',
  });

  useEffect(() => {
    const load = async () => {
      const [{ data: m }, { data: s }] = await Promise.all([
        supabase.from('masters').select('id, name, specialty').eq('is_active', true).order('name'),
        supabase.from('services').select('id, name, duration, price').eq('is_active', true).order('name'),
      ]);
      setMasters(m ?? []);
      setServices(s ?? []);
    };
    load();
  }, []);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.master_id || !form.service_id || !form.date || !form.time || !form.client_name.trim() || !form.client_phone.trim()) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('bookings').insert({
      master_id: form.master_id,
      service_id: form.service_id,
      date: form.date,
      time: form.time,
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim(),
      status: form.status,
    });
    if (error) {
      toast.error('Ошибка создания записи: ' + error.message);
    } else {
      toast.success('Запись создана');
      router.push('/admin/bookings');
      router.refresh();
    }
    setLoading(false);
  };

  const selectedService = services.find(s => s.id === form.service_id);

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/bookings"
          className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Новая запись</h1>
          <p className="text-slate-500 text-sm mt-0.5">Добавление записи вручную</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-6">

        {/* Клиент */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Клиент</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Имя и фамилия *</label>
              <input
                value={form.client_name}
                onChange={e => set('client_name', e.target.value)}
                placeholder="Анна Иванова"
                className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Телефон *</label>
              <input
                value={form.client_phone}
                onChange={e => set('client_phone', e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Мастер и услуга */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Запись</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Мастер *</label>
              <select
                value={form.master_id}
                onChange={e => set('master_id', e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors bg-white"
              >
                <option value="">Выберите мастера</option>
                {masters.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Услуга *</label>
              <select
                value={form.service_id}
                onChange={e => set('service_id', e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors bg-white"
              >
                <option value="">Выберите услугу</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.price} руб.</option>
                ))}
              </select>
            </div>
          </div>

          {selectedService && (
            <div className="mt-3 px-4 py-3 bg-[#fdf7f0] rounded-2xl text-sm text-slate-600 flex gap-4">
              <span>Длительность: <strong>{selectedService.duration} мин</strong></span>
              <span>Стоимость: <strong>{selectedService.price} руб.</strong></span>
            </div>
          )}
        </div>

        {/* Дата и время */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Дата и время</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Дата *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Время *</label>
              <select
                value={form.time}
                onChange={e => set('time', e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a] transition-colors bg-white"
              >
                {TIMES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Статус */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Статус</p>
          <div className="flex gap-3 flex-wrap">
            {[
              { val: 'confirmed', label: 'Подтверждено' },
              { val: 'pending',   label: 'Ожидает' },
              { val: 'completed', label: 'Завершено' },
            ].map(({ val, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => set('status', val)}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all border ${
                  form.status === val
                    ? 'bg-[#c9a08a] text-white border-[#c9a08a]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#c9a08a]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-12 bg-[#c9a08a] hover:bg-[#b38f79] text-white rounded-2xl font-medium text-sm transition-all disabled:opacity-60"
          >
            {loading ? 'Сохраняем...' : 'Создать запись'}
          </button>
          <Link
            href="/admin/bookings"
            className="h-12 px-6 border border-slate-200 text-slate-600 rounded-2xl font-medium text-sm transition-all hover:bg-slate-50 flex items-center"
          >
            Отмена
          </Link>
        </div>
      </div>
    </div>
  );
}