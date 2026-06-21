// app/master/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import SignOutLink from '@/components/shared/SignOutLink';

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/master');

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('salon_members')
    .select('role')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (!member || member.role !== 'master') {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen flex bg-[#faf8f5]">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-20">
        <div className="px-6 py-7 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Кабинет мастера</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/master"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-[#fdf7f0] hover:text-[#c9a08a] transition-all text-sm font-medium"
          >
            <Calendar className="w-4 h-4" />
            Мои записи
          </Link>
        </nav>
        <div className="px-3 py-4 border-t border-slate-100">
          <SignOutLink />
        </div>
      </aside>
      <main className="ml-64 flex-1 min-h-screen">{children}</main>
    </div>
  );
}