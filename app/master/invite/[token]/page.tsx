// app/master/invite/[token]/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function MasterInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=/master/invite/${token}`);
  }

  const supabase = await createClient();
 const { data, error } = await supabase.rpc('accept_salon_invite', { p_token: token });

  if (error || data !== 'ok') {
    const messages: Record<string, string> = {
      not_found: 'Приглашение не найдено',
      already_used: 'Это приглашение уже использовано',
      expired: 'Приглашение истекло',
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">
          {messages[data ?? ''] ?? 'Не удалось принять приглашение'}
        </p>
      </div>
    );
  }

  redirect('/master');
}