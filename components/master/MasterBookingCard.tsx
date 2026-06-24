'use client';

import { useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase/useSupabaseClient';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Phone, Clock, Check, X } from 'lucide-react';
import { getStatusConfig } from '@/lib/booking-status';

type Booking = {
  id: string;
  date: string;
  time: string;
  client_name: string;
  client_phone: string;
  status: string;
  services: { name: string; duration: number; price: number } | null;
};

export default function MasterBookingCard({ booking }: { booking: Booking }) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.from('bookings').update({ status }).eq('id', booking.id);
    if (error) {
      toast.error('Не удалось обновить статус');
    } else {
      toast.success('Готово');
      router.refresh();
    }
    setLoading(false);
  };

  const st = getStatusConfig(booking.status);

  return (
    <div className="bg-card rounded-3xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-card-foreground text-base">{booking.client_name}</p>
          
           <a href={`tel:${booking.client_phone}`}
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mt-1"
          >
            <Phone className="w-3.5 h-3.5" />
            {booking.client_phone}
          </a>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${st.cls}`}>
          {st.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-card-foreground/80 mb-1">
        <Clock className="w-4 h-4 text-muted-foreground" />
        {booking.time} · {booking.services?.name ?? '—'}
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {booking.services?.duration} мин · {booking.services?.price} руб.
      </p>

      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
        <div className="flex gap-2">
          {booking.status === 'pending' && (
            <button
              onClick={() => updateStatus('confirmed')}
              disabled={loading}
              className="flex-1 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all disabled:opacity-50"
            >
              Подтвердить
            </button>
          )}
          {booking.status === 'confirmed' && (
            <button
              onClick={() => updateStatus('completed')}
              disabled={loading}
              className="flex-1 h-11 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Завершить
            </button>
          )}
          <button
            onClick={() => updateStatus('cancelled')}
            disabled={loading}
            className="h-11 px-4 rounded-2xl border border-border text-muted-foreground hover:bg-destructive/15 hover:text-destructive hover:border-destructive/30 transition-all disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}