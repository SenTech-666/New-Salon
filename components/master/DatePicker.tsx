'use client';

import { useRouter } from 'next/navigation';

export default function MasterDatePicker({ date }: { date: string }) {
  const router = useRouter();

  return (
    <input
      type="date"
      defaultValue={date}
      onChange={(e) => router.push(`/master/bookings?date=${e.target.value}`)}
      className="w-full h-11 px-4 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary"
    />
  );
}