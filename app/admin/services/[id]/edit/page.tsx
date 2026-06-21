import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ServiceEditForm from '@/components/admin/ServiceEditForm';

export default async function ServiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [serviceRes, mastersRes, inventoryRes, consumablesRes] = await Promise.all([
    supabase
      .from('services')
      .select('id, name, duration, price, master_id, is_active')
      .eq('id', id)
      .single(),
    supabase
      .from('masters')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('inventory_items')
      .select('id, name, unit')
      .order('name'),
    supabase
      .from('service_consumables')
      .select('id, item_id, amount')
      .eq('service_id', id),
  ]);

  if (!serviceRes.data) notFound();

  return (
    <div className="p-8 max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/services"
          className="w-10 h-10 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Редактировать услугу</h1>
          <p className="text-slate-500 text-sm mt-0.5">{serviceRes.data.name}</p>
        </div>
      </div>

      <ServiceEditForm
        service={serviceRes.data}
        masters={mastersRes.data ?? []}
        inventoryItems={inventoryRes.data ?? []}
        initialConsumables={consumablesRes.data ?? []}
      />
    </div>
  );
}