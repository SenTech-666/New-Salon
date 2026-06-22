'use client';

import { useState, useEffect, useRef } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { toast } from 'sonner';
import {
  Pencil,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string | null;
};

export default function InventoryTable({
  initialItems,
}: {
  initialItems: InventoryItem[];
}) {
  const supabase = useSupabaseClient();
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Realtime: любое изменение в inventory_items обновляет таблицу мгновенно,
  // в том числе автосписание при завершении записи (триггер на bookings).
  // Подписка создаётся только когда supabase готов (Clerk-сессия загружена) —
  // иначе канал подпишется без авторизации и не получит события на
  // таблице, где RLS теперь требует совпадения salon_id.
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('inventory-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items' },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((i) =>
                i.id === (payload.new as InventoryItem).id
                  ? (payload.new as InventoryItem)
                  : i
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setItems((prev) => [...prev, payload.new as InventoryItem]);
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) =>
              prev.filter((i) => i.id !== (payload.old as InventoryItem).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValue(String(item.quantity));
  };

  const saveEdit = async (id: string) => {
    if (!supabase) return;
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) {
      toast.error('Введите корректное число');
      return;
    }
    const { error } = await supabase
      .from('inventory_items')
      .update({ quantity: value, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Ошибка обновления: ' + error.message);
    } else {
      toast.success('Остаток обновлён');
    }
    setEditingId(null);
  };

  const deleteItem = async (id: string, name: string) => {
    if (!supabase) return;
    if (!confirm(`Удалить "${name}" со склада?`)) return;
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) {
      toast.error('Ошибка удаления: ' + error.message);
    } else {
      toast.success('Товар удалён');
    }
  };

  // Экспорт текущих остатков в xlsx одной кнопкой
  const exportToXlsx = () => {
    const rows = items.map((i) => ({
      Название: i.name,
      'Ед. изм.': i.unit,
      Остаток: i.quantity,
      'Порог уведомления': i.low_stock_threshold,
      'Обновлено': i.updated_at
        ? new Date(i.updated_at).toLocaleString('ru-RU')
        : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Остатки');
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `sklad-ostatki-${date}.xlsx`);
    toast.success('Файл сохранён');
  };

  // Импорт xlsx: ожидает колонки Название / Ед. изм. / Остаток / Порог уведомления.
  // Существующие товары (совпадение по названию) обновляются, новые создаются.
  // salon_id у новых строк подставится автоматически через DEFAULT в базе.
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!supabase) {
      toast.error('Подождите, проверяем вход в систему...');
      return;
    }
    setImporting(true);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      if (rows.length === 0) {
        toast.error('Файл пустой или не распознан');
        setImporting(false);
        return;
      }

      let created = 0;
      let updated = 0;

      for (const row of rows) {
        const name = String(
          row['Название'] ?? row['название'] ?? row['name'] ?? ''
        ).trim();
        if (!name) continue;

        const unit = String(
          row['Ед. изм.'] ?? row['unit'] ?? 'шт'
        ).trim();
        const quantity = Number(
          row['Остаток'] ?? row['quantity'] ?? 0
        );
        const threshold = Number(
          row['Порог уведомления'] ?? row['low_stock_threshold'] ?? 5
        );

        const existing = items.find(
          (i) => i.name.toLowerCase() === name.toLowerCase()
        );

        if (existing) {
          const { error } = await supabase
            .from('inventory_items')
            .update({
              unit,
              quantity,
              low_stock_threshold: threshold,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
          if (!error) updated++;
        } else {
          const { error } = await supabase.from('inventory_items').insert({
            name,
            unit,
            quantity,
            low_stock_threshold: threshold,
          });
          if (!error) created++;
        }
      }

      toast.success(`Импорт завершён: создано ${created}, обновлено ${updated}`);
    } catch (err: any) {
      toast.error('Ошибка чтения файла: ' + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sorted = [...items].sort((a, b) => {
    const aLow = a.quantity <= a.low_stock_threshold;
    const bLow = b.quantity <= b.low_stock_threshold;
    if (aLow !== bLow) return aLow ? -1 : 1;
    return a.name.localeCompare(b.name, 'ru');
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={exportToXlsx}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-card-foreground/80 hover:bg-muted transition-all"
        >
          <Download className="w-4 h-4" />
          Экспорт в Excel
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing || !supabase}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-card-foreground/80 hover:bg-muted transition-all disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {importing ? 'Импортируем...' : 'Импорт из Excel'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {sorted.length === 0 ? (
        <div className="bg-card rounded-3xl border border-border p-16 text-center">
          <FileSpreadsheet className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">Склад пуст. Добавьте товар или импортируйте Excel-файл.</p>
        </div>
      ) : (
        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Название
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Остаток
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Порог
                </th>
                <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sorted.map((item) => {
                const isLow = item.quantity <= item.low_stock_threshold;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-muted/50 transition-colors ${
                      isLow ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-card-foreground text-sm">{item.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            className="w-20 h-8 px-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
                          />
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="w-7 h-7 rounded-lg hover:bg-success/15 text-success flex items-center justify-center"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="w-7 h-7 rounded-lg hover:bg-muted text-muted-foreground flex items-center justify-center"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="text-sm text-card-foreground/80 hover:text-primary flex items-center gap-1.5 group"
                        >
                          <span className={isLow ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>
                            {item.quantity}
                          </span>
                          <span className="text-muted-foreground">{item.unit}</span>
                          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-muted-foreground">
                        {item.low_stock_threshold} {item.unit}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          Заканчивается
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-success/15 text-success w-fit">
                          В наличии
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => deleteItem(item.id, item.name)}
                        disabled={!supabase}
                        className="w-8 h-8 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}