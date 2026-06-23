import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StorefrontPage from '@/components/storefront/StorefrontPage';

export default async function SalonHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const [salonResult, servicesResult, galleryResult] = await Promise.all([
    supabase.rpc('get_public_salon_by_slug', { p_slug: slug }),
    supabase.rpc('get_public_services', { p_salon_slug: slug }),
    supabase.rpc('get_public_salon_gallery', { p_salon_slug: slug }),
  ]);

  const salon = salonResult.data?.[0];

  if (salonResult.error || !salon) {
    notFound();
  }

  return (
    <StorefrontPage
      salon={salon}
      services={servicesResult.data ?? []}
      gallery={galleryResult.data ?? []}
    />
  );
}