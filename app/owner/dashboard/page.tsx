// app/owner/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Edit3, Calendar, Users, DollarSign, Clock } from 'lucide-react';

type Booking = {
  id: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  status: string;
  master: { id: string; name: string };
  service: { id: string; name: string; price: number };
};

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
  isActive: boolean;
};

type Master = {
  id: string;
  name: string;
  specialty: string;
  isActive: boolean;
};

export default function OwnerDashboard() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'bookings' | 'services' | 'masters' | 'analytics'>('bookings');
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [masters, setMasters] = useState<Master[]>([]);

  const [filters, setFilters] = useState({
    search: '',
    masterId: '',
    date: '',
  });

  // Модалки
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingMaster, setEditingMaster] = useState<Master | null>(null);

  // Формы
  const [newService, setNewService] = useState({ name: '', duration: 60, price: 0 });
  const [newMaster, setNewMaster] = useState({ name: '', specialty: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const [bookingsRes, servicesRes, mastersRes] = await Promise.all([
      supabase
        .from('bookings')
        .select(`
          *,
          master:masters(id, name),
          service:services(id, name, price)
        `)
        .order('date', { ascending: true })
        .order('time', { ascending: true }),
      supabase.from('services').select('*').order('name'),
      supabase.from('masters').select('*').order('name'),
    ]);

    if (bookingsRes.data) setBookings(bookingsRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
    if (mastersRes.data) setMasters(mastersRes.data);
  };

  // === CRUD УСЛУГИ ===
  const saveService = async () => {
    if (!newService.name || newService.price <= 0) {
      toast.error('Заполните название и цену');
      return;
    }

    if (editingService) {
      await supabase.from('services').update(newService).eq('id', editingService.id);
      toast.success('Услуга обновлена');
    } else {
      await supabase.from('services').insert(newService);
      toast.success('Услуга добавлена');
    }

    setIsServiceModalOpen(false);
    setEditingService(null);
    setNewService({ name: '', duration: 60, price: 0 });
    fetchAllData();
  };

  const deleteService = async (id: string) => {
    if (!confirm('Удалить услугу?')) return;
    await supabase.from('services').delete().eq('id', id);
    toast.success('Услуга удалена');
    fetchAllData();
  };

  // === CRUD МАСТЕРА ===
  const saveMaster = async () => {
    if (!newMaster.name) return toast.error('Введите имя мастера');

    if (editingMaster) {
      await supabase.from('masters').update(newMaster).eq('id', editingMaster.id);
    } else {
      await supabase.from('masters').insert(newMaster);
    }

    setIsMasterModalOpen(false);
    setEditingMaster(null);
    setNewMaster({ name: '', specialty: '' });
    fetchAllData();
    toast.success(editingMaster ? 'Мастер обновлён' : 'Мастер добавлен');
  };

  const deleteMaster = async (id: string) => {
    if (!confirm('Удалить мастера?')) return;
    await supabase.from('masters').delete().eq('id', id);
    toast.success('Мастер удалён');
    fetchAllData();
  };

  // === ЗАПИСИ ===
  const cancelBooking = async (id: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('id', id);

    if (!error) {
      toast.success('Запись отменена');
      fetchAllData();
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchSearch = !filters.search || 
      b.clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
      b.clientPhone.includes(filters.search);
    
    const matchMaster = !filters.masterId || b.master?.id === filters.masterId;
    const matchDate = !filters.date || b.date.startsWith(filters.date);

    return matchSearch && matchMaster && matchDate;
  });

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.service?.price || 0), 0);

  return (
    <div className="min-h-screen bg-[#faf8f5] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900">Админка • Василики</h1>
            <p className="text-xl text-slate-600 mt-1">Панель управления владельца</p>
          </div>
          <Button onClick={fetchAllData} variant="outline">
            Обновить данные
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="bookings">Записи</TabsTrigger>
            <TabsTrigger value="services">Услуги</TabsTrigger>
            <TabsTrigger value="masters">Мастера</TabsTrigger>
            <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          </TabsList>

          {/* ==================== ЗАПИСИ ==================== */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Calendar className="w-6 h-6" />
                  Все записи
                </CardTitle>
                <div className="flex flex-col md:flex-row gap-3 mt-4">
                  <Input
                    placeholder="Поиск по имени или телефону"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={filters.date}
                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                  />
                  <select
                    className="border rounded-md px-3 py-2"
                    value={filters.masterId}
                    onChange={(e) => setFilters({ ...filters, masterId: e.target.value })}
                  >
                    <option value="">Все мастера</option>
                    {masters.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-4">Дата и время</th>
                        <th className="p-4">Клиент</th>
                        <th className="p-4">Мастер</th>
                        <th className="p-4">Услуга</th>
                        <th className="p-4">Статус</th>
                        <th className="p-4 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b hover:bg-slate-50">
                          <td className="p-4 font-medium">
                            {new Date(booking.date).toLocaleDateString('ru-RU')} • {booking.time}
                          </td>
                          <td className="p-4">
                            {booking.clientName}<br />
                            <span className="text-sm text-slate-500">{booking.clientPhone}</span>
                          </td>
                          <td className="p-4">{booking.master?.name}</td>
                          <td className="p-4">{booking.service?.name}</td>
                          <td className="p-4">
                            <Badge variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => cancelBooking(booking.id)}
                            >
                              Отменить
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== УСЛУГИ ==================== */}
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Услуги</CardTitle>
                <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingService(null); setNewService({ name: '', duration: 60, price: 0 }); }}>
                      <Plus className="mr-2 h-4 w-4" /> Добавить услугу
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingService ? 'Редактировать' : 'Новая'} услуга</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Название</Label>
                        <Input value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Длительность (мин)</Label>
                          <Input type="number" value={newService.duration} onChange={(e) => setNewService({ ...newService, duration: +e.target.value })} />
                        </div>
                        <div>
                          <Label>Цена (₽)</Label>
                          <Input type="number" value={newService.price} onChange={(e) => setNewService({ ...newService, price: +e.target.value })} />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveService}>Сохранить</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border">
                    <div>
                      <p className="font-semibold text-lg">{service.name}</p>
                      <p className="text-slate-500">{service.duration} мин • {service.price} ₽</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingService(service);
                          setNewService(service);
                          setIsServiceModalOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteService(service.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== МАСТЕРА ==================== */}
          <TabsContent value="masters">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Мастера</CardTitle>
                <Button onClick={() => { setEditingMaster(null); setNewMaster({ name: '', specialty: '' }); setIsMasterModalOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Добавить мастера
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {masters.map((master) => (
                  <div key={master.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border">
                    <div>
                      <p className="font-semibold text-lg">{master.name}</p>
                      <p className="text-slate-500">{master.specialty}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingMaster(master);
                        setNewMaster(master);
                        setIsMasterModalOpen(true);
                      }}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteMaster(master.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== АНАЛИТИКА ==================== */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6" />
                  Аналитика
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-600">Общая выручка (фильтр)</p>
                      <p className="text-5xl font-bold text-[#c9a08a] mt-2">{totalRevenue.toLocaleString('ru-RU')} ₽</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-600">Всего записей</p>
                      <p className="text-5xl font-bold mt-2">{filteredBookings.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-slate-600">Средний чек</p>
                      <p className="text-5xl font-bold mt-2">
                        {filteredBookings.length 
                          ? Math.round(totalRevenue / filteredBookings.length) 
                          : 0} ₽
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Модалка мастера */}
      <Dialog open={isMasterModalOpen} onOpenChange={setIsMasterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaster ? 'Редактировать' : 'Добавить'} мастера</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Имя</Label>
              <Input value={newMaster.name} onChange={(e) => setNewMaster({ ...newMaster, name: e.target.value })} />
            </div>
            <div>
              <Label>Специализация</Label>
              <Input value={newMaster.specialty} onChange={(e) => setNewMaster({ ...newMaster, specialty: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveMaster}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}