import { prisma } from '@/lib/prisma';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Column = {
  accessorKey: string;
  header: string;
};

export default async function AdminMasters() {
  const masters = await prisma.master.findMany({
    orderBy: { name: 'asc' },
  });

  const columns: Column[] = [
    { accessorKey: 'name', header: 'Имя' },
    { accessorKey: 'specialty', header: 'Специальность' },
    { accessorKey: 'is_active', header: 'Активен' },
  ];

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Мастера</h1>
        <Button asChild>
          <Link href="/admin/masters/new">Добавить мастера</Link>
        </Button>
      </div>
      <DataTable data={masters} columns={columns} />
    </div>
  );
}