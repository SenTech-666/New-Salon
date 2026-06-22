import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import InventoryTable from '@/components/admin/InventoryTable';

export default async function AdminInventoryPage() {
  const supabase = await createClient();

  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name');

  const lowStockCount =
    items?.filter((i) => i.quantity <= i.low_stock_threshold).length ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Складской учёт</h1>
          <p className="text-muted-foreground mt-1">
            {items?.length ?? 0} позиций
            {lowStockCount > 0 && (
              <span className="text-amber-500 dark:text-amber-400 font-medium">
                {' · '}
                {lowStockCount} заканчивается
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/inventory/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-2xl text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Добавить товар
        </Link>
      </div>

      <InventoryTable initialItems={items ?? []} />
    </div>
  );
}