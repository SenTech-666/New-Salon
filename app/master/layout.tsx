import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MasterNavDesktop, MasterNavMobile } from '@/components/master/MasterNav';
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
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-card border-r border-border flex-col fixed h-full z-20 hidden sm:flex">
        <div className="px-6 py-7 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Кабинет мастера
          </p>
        </div>
        <MasterNavDesktop />
        <div className="px-3 py-4 border-t border-border">
          <SignOutLink />
        </div>
      </aside>

      <main className="flex-1 min-h-screen sm:ml-64 pb-20 sm:pb-0">{children}</main>

      <MasterNavMobile />
    </div>
  );
}