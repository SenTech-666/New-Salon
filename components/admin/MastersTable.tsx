'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { toast } from 'sonner';
import { Pencil, Power, UserPlus, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type Master = {
  id: string;
  name: string;
  specialty: string | null;
  is_active: boolean;
  photo: string | null;
};

export default function MastersTable({ masters }: { masters: Master[] }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState<string | null>(null);

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteMasterName, setInviteMasterName] = useState<string>('');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleActive = async (id: string, current: boolean) => {
    if (!supabase) return;
    setLoading(id);
    const { error } = await supabase
      .from('masters')
      .update({ is_active: !current })
      .eq('id', id);
    if (error) {
      toast.error('Ошибка обновления');
    } else {
      toast.success(current ? 'Мастер деактивирован' : 'Мастер активирован');
      router.refresh();
    }
    setLoading(null);
  };

 const generateInvite = async (masterId: string, masterName: string) => {
  if (!supabase) return;
  setGeneratingFor(masterId);
  try {
    const { data, error } = await supabase
      .from('master_invites')
      .insert({ master_id: masterId })
      .select('token')
      .single();

    if (error || !data) {
      toast.error('Ошибка создания приглашения: ' + (error?.message ?? ''));
      return;
    }

    const link = `${window.location.origin}/master/invite/${data.token}`;
    setInviteLink(link);
    setInviteMasterName(masterName);
    setCopied(false);
  } finally {
    setGeneratingFor(null);
  }
};

  const copyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Ссылка скопирована');
  };

  if (masters.length === 0) {
    return (
      <div className="bg-card rounded-3xl border border-border p-16 text-center">
        <p className="text-muted-foreground mb-4">Мастеров пока нет</p>
        <Link
          href="/admin/masters/new"
          className="text-sm text-primary hover:underline"
        >
          Добавить первого мастера
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {masters.map(m => (
          <div
            key={m.id}
            className={`bg-card rounded-3xl border p-6 flex items-center justify-between transition-all ${
              m.is_active ? 'border-border' : 'border-border opacity-60'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-primary font-bold text-lg">
                {m.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-card-foreground">{m.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{m.specialty ?? 'Специальность не указана'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                m.is_active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
              }`}>
                {m.is_active ? 'Активен' : 'Неактивен'}
              </span>

              <button
                onClick={() => generateInvite(m.id, m.name)}
                disabled={generatingFor === m.id || !supabase}
                title="Пригласить в личный кабинет"
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-accent transition-all disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
              </button>

              <Link
                href={`/admin/masters/${m.id}/edit`}
                className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <Pencil className="w-4 h-4" />
              </Link>

              <button
                onClick={() => toggleActive(m.id, m.is_active)}
                disabled={loading === m.id || !supabase}
                title={m.is_active ? 'Деактивировать' : 'Активировать'}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  m.is_active
                    ? 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10'
                    : 'border-success/30 text-success hover:bg-success/10'
                }`}
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!inviteLink} onOpenChange={(open) => !open && setInviteLink(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Приглашение для {inviteMasterName}</DialogTitle>
            <DialogDescription>
              Отправьте эту ссылку мастеру. Она действует 7 дней и одноразовая —
              после входа мастер получит доступ к своему личному кабинету записей.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 bg-muted rounded-2xl p-3 mt-2">
            <input
              readOnly
              value={inviteLink ?? ''}
              className="flex-1 bg-transparent text-sm text-card-foreground/80 outline-none truncate"
            />
            <button
              onClick={copyLink}
              className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-all shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}