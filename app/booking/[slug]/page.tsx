// app/booking/[slug]/page.tsx
//
// Публичная страница записи конкретного салона. Резолвит slug на сервере
// (анонимный запрос — на этой странице посетитель не залогинен через
// Clerk), чтобы сразу отдать 404, если салона с таким slug не существует,
// вместо того чтобы пускать клиента в BookingPage, который потом сам
// узнает об этом только после загрузки.

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BookingPage from '@/components/booking/BookingPage';

export default async function SalonBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // lib/supabase/server.ts всегда пытается передать Clerk-токен через
  // accessToken(), но на этой публичной странице посетитель обычно не
  // залогинен — auth().getToken() в таком случае возвращает null, и
  // запрос идёт как полностью анонимный (роль anon). get_public_salon_by_slug
  // — SECURITY DEFINER функция, доступная anon без JWT, так что это
  // безопасно и ожидаемо.
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