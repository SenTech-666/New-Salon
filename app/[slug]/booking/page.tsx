import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BookingPage from '@/components/booking/BookingPage';

export default async function SalonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_public_salon_by_slug', {
    p_slug: slug,
  });

  const salon = data?.[0];

  if (error || !salon) {
    notFound();
  }

  return <BookingPage salonSlug={slug} />;
}