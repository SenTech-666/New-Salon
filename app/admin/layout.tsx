import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  // Пример проверки роли (добавь свою модель User с enum Role)
  // const user = await prisma.user.findUnique({ where: { id: userId } });
  // if (user?.role !== 'ADMIN' && user?.role !== 'OWNER') redirect('/');

  return <>{children}</>;
}