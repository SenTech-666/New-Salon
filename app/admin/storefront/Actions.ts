'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getSalonId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('salons')
    .select('id')
    .eq('owner_clerk_id', userId)
    .single();

  if (error || !data) throw new Error('Salon not found');
  return data.id as string;
}

export async function updateSalonInfo(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const salonId = await getSalonId(supabase);

  const payload = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    address: (formData.get('address') as string) || null,
    phone: (formData.get('phone') as string) || null,
    lat: formData.get('lat') ? Number(formData.get('lat')) : null,
    lng: formData.get('lng') ? Number(formData.get('lng')) : null,
  };

  const { error } = await supabase
    .from('salons')
    .update(payload)
    .eq('id', salonId);

  if (error) return { error: error.message };

  revalidatePath('/admin/storefront');
  return { success: true };
}

export async function updateSocialLinks(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const salonId = await getSalonId(supabase);

  const social_links: Record<string, string> = {};
  for (const key of ['telegram', 'instagram', 'vk', 'whatsapp']) {
    const val = (formData.get(key) as string)?.trim();
    if (val) social_links[key] = val;
  }

  const { error } = await supabase
    .from('salons')
    .update({ social_links })
    .eq('id', salonId);

  if (error) return { error: error.message };

  revalidatePath('/admin/storefront');
  return { success: true };
}

export async function updateBusinessHours(_: unknown, formData: FormData) {
  const supabase = await createClient();
  const salonId = await getSalonId(supabase);

  // days 0–6 (0 = воскресенье, как в JS Date.getDay())
  const hours = Array.from({ length: 7 }, (_, i) => ({
    day_of_week: i,
    is_day_off: formData.get(`day_${i}_off`) === 'true',
    time_from: (formData.get(`day_${i}_from`) as string) || '09:00',
    time_to: (formData.get(`day_${i}_to`) as string) || '20:00',
  }));

  const { error } = await supabase
    .from('salons')
    .update({ business_hours: hours })
    .eq('id', salonId);

  if (error) return { error: error.message };

  revalidatePath('/admin/storefront');
  return { success: true };
}

export async function deleteGalleryImage(imageId: string) {
  const supabase = await createClient();
  const salonId = await getSalonId(supabase);

  // Достаём URL чтобы удалить из Storage
  const { data: img } = await supabase
    .from('salon_gallery_images')
    .select('url')
    .eq('id', imageId)
    .eq('salon_id', salonId)
    .single();

  if (img?.url) {
    // Извлекаем path из publicUrl: всё после /salon-media/
    const match = img.url.match(/salon-media\/(.+)$/);
    if (match) {
      await supabase.storage.from('salon-media').remove([match[1]]);
    }
  }

  const { error } = await supabase
    .from('salon_gallery_images')
    .delete()
    .eq('id', imageId)
    .eq('salon_id', salonId);

  if (error) return { error: error.message };

  revalidatePath('/admin/storefront');
  return { success: true };
}