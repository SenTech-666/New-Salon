// app/api/salon/gallery/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadToSupabase } from '@/lib/upload-helper';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: salon, error: salonError } = await supabase
    .from('salons')
    .select('id')
    .eq('owner_clerk_id', userId)
    .single();

  if (salonError || !salon) {
    return Response.json({ error: 'Salon not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file || file.size === 0) {
    return Response.json({ error: 'Файл не выбран' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const path = `${salon.id}/gallery-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await uploadToSupabase(
    'salon-media',
    path,
    buffer,
    file.type
  );

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('salon-media')
    .getPublicUrl(path);

  const { data: existing } = await supabase
    .from('salon_gallery_images')
    .select('position')
    .eq('salon_id', salon.id)
    .order('position', { ascending: false })
    .limit(1);

  const position = (existing?.[0]?.position ?? 0) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from('salon_gallery_images')
    .insert({ salon_id: salon.id, url: publicUrl, position })
    .select('id')
    .single();

  if (insertError) {
    console.log('=== INSERT ERROR ===', JSON.stringify(insertError));
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  revalidatePath('/admin/storefront');
  return Response.json({ success: true, url: publicUrl, id: inserted.id });
}