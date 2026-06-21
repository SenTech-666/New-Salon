'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
};

type Consumable = {
  id: string; // id строки в service_consumables, временное "new-N" для несохранённых
  item_id: string;
  amount: string;
  isNew?: boolean;
};

export default function ServiceConsumablesEditor({
  serviceId,
  inventoryItems,
  initialConsumables,
}: {
  serviceId: string;
  inventoryItems: InventoryItem[];
  initialConsumables: { id: string; item_id: string; amount: number }[];
}) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [rows, setRows] = useState<Consumable[]>(
    initialConsumables.map((c) => ({
      id: c.id,
      item_id: c.item_id,
      amount: String(c.amount),
    }))
  );
  const [saving, setSaving] = useState(false);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, item_id: '', amount: '1', isNew: true },
    ]);
  };

  const updateRow = (id: string, field: 'item_id' | 'amount', value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRow = async (id: string, isNew?: boolean) => {
    if (!isNew) {
      if (!supabase) return;
      const { error } = await supabase
        .from('service_consumables')
        .delete()
        .eq('id', id);
      if (error) {
        toast.error('Ошибка удаления: ' + error.message);
        return;
      }
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast.success('Расходник удалён из рецепта');
  };

  const saveAll = async () => {
    if (!supabase) {
      toast.error('Подождите, проверяем вход в систему...');
      return;
    }
    const validRows = rows.filter((r) => r.item_id && parseFloat(r.amount) > 0);
    if (validRows.length !== rows.length) {
      toast.error('Заполните расходник и количество во всех строках');
      return;
    }

    setSaving(true);

    for (const row of rows) {
      if (row.isNew) {
        // salon_id не передаём явно — подставится автоматически через
        // DEFAULT current_salon_id() на стороне базы.
        const { error } = await supabase.from('service_consumables').insert({
          service_id: serviceId,
          item_id: row.item_id,
          amount: parseFloat(row.amount),
        });
        if (error) {
          toast.error('Ошибка сохранения: ' + error.message);
          setSaving(false);
          return;
        }
      } else {
        const { error } = await supabase
          .from('service_consumables')
          .update({ item_id: row.item_id, amount: parseFloat(row.amount) })
          .eq('id', row.id);
        if (error) {
          toast.error('Ошибка сохранения: ' + error.message);
          setSaving(false);
          return;
        }
      }
    }

    toast.success('Рецепт списания сохранён');
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900">Расходники для услуги</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Списываются автоматически со склада, когда запись переводят в статус
            "Завершено"
          </p>
        </div>
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 text-sm text-[#c9a08a] hover:text-[#b38f79] font-medium"
        >
          <Plus className="w-4 h-4" />
          Добавить
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">
          Рецепт пуст — расходники не будут списываться при завершении услуги.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3">
              <select
                value={row.item_id}
                onChange={(e) => updateRow(row.id, 'item_id', e.target.value)}
                className="flex-1 h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
              >
                <option value="">Выберите расходник</option>
                {inventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit})
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                value={row.amount}
                onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                placeholder="Кол-во"
                className="w-24 h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#c9a08a]"
              />
              <button
                onClick={() => removeRow(row.id, row.isNew)}
                disabled={!supabase && !row.isNew}
                className="w-9 h-9 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <button
          onClick={saveAll}
          disabled={saving || !supabase}
          className="w-full mt-5 h-11 rounded-2xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium transition-all disabled:opacity-50"
        >
          {saving ? 'Сохраняем...' : 'Сохранить рецепт'}
        </button>
      )}
    </div>
  );
}