// app/api/salon/photo/route.ts
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
  const type = formData.get('type') as string;
  const file = formData.get('file') as File | null;

  if (type !== 'photo' && type !== 'cover') {
    return Response.json({ error: 'Неверный тип фото' }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return Response.json({ error: 'Файл не выбран' }, { status: 400 });
  }

  const ext = file.name.split('.').pop();
  const path = `${salon.id}/${type}-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`=== ROUTE: начинаю upload (${process.platform}) ===`);
  const tUp = Date.now();

  const { error: uploadError } = await uploadToSupabase(
    'salon-media',
    path,
    buffer,
    file.type
  );

  console.log(`=== ROUTE: upload занял ${Date.now() - tUp}ms ===`);

  if (uploadError) {
    console.log('=== ROUTE: ошибка upload ===', uploadError.message);
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('salon-media')
    .getPublicUrl(path);

  const field = type === 'photo' ? 'photo_url' : 'cover_url';
  const { error: updateError } = await supabase
    .from('salons')
    .update({ [field]: publicUrl })
    .eq('id', salon.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  revalidatePath('/admin/storefront');
  return Response.json({ success: true, url: publicUrl });
}