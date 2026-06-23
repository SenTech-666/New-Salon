import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StorefrontEditor from './StorefrontEditor';

export const metadata = { title: 'Витрина' };

export default async function StorefrontPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in?redirect_url=/admin/storefront');

  const supabase = await createClient();

  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .select(`
      id, name, slug, description, address, phone,
      photo_url, cover_url, business_hours, social_links,
      lat, lng
    `)
    .eq('owner_clerk_id', userId)
    .single();

  if (salonError || !salon) redirect('/onboarding');

  const { data: gallery } = await supabase
    .from('gallery_images')
    .select('id, url, position')
    .eq('salon_id', salon.id)
    .order('position', { ascending: true });

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <StorefrontEditor
        salon={salon}
        gallery={gallery ?? []}
      />
    </div>
  );
}