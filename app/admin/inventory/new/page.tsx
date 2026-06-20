'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('шт');
  const [quantity, setQuantity] = useState('0');
  const [threshold, setThreshold] = useState('5');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Введите название товара');
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('inventory_items').insert({
      name: name.trim(),
      unit: unit.trim() || 'шт',
      quantity: parseFloat(quantity) || 0,
      low_stock_threshold: parseFloat(threshold) || 0,
    });

    if (error) {
      toast.error('Ошибка: ' + error.message);
      setLoading(false);
      return;
    }

    toast.success('Товар добавлен на склад');
    router.push('/admin/inventory');
    router.refresh();
  };

  return (
    <div className="p-8 max-w-lg">
      <Link
        href="/admin/inventory"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к складу
      </Link>

      <div className="bg-white rounded-3xl border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Новый товар</h1>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1.5">
              Название
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: База Luxio"
              className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1.5">
                Ед. измерения
              </label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="шт, мл, упак."
                className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 block mb-1.5">
                Текущий остаток
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1.5">
              Порог уведомления
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Когда остаток опустится до этого значения или ниже — товар будет
              помечен как заканчивающийся.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-[#c9a08a] hover:bg-[#b38f79] text-white font-medium transition-all disabled:opacity-50"
          >
            {loading ? 'Добавляем...' : 'Добавить товар'}
          </button>
        </div>
      </div>
    </div>
  );
}