import { auth } from '@clerk/nextjs/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf8f5] via-[#f5f0eb] to-[#ede4d9] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tighter mb-8">Админка</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Управление мастерами</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/masters">Добавить/редактировать мастеров</Link>
              </Button>
            </CardContent>
          </Card>
          {/* остальные карточки: услуги, записи, статистика, клиенты */}
        </div>
      </div>
    </div>
  );
}