// app/api/salon/gallery/route.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { uploadToSupabase } from '@/lib/upload-helper';
import { AppError, mapSupabaseError, errorResponse } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new AppError('unauthorized', 'Войдите в систему');
    }

    const supabase = await createClient();

    const { data: salon, error: salonError } = await supabase
      .from('salons')
      .select('id')
      .eq('owner_clerk_id', userId)
      .single();

    if (salonError || !salon) {
      throw new AppError('not_found', 'Салон не найден');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      throw new AppError('validation_error', 'Файл не выбран');
    }

    // Доп. защита, которой не было: ограничение размера и типа файла.
    // Без этого кто угодно с доступом в админку может залить 500MB
    // видео под видом фото и забить Storage за один запрос.
    const MAX_SIZE = 8 * 1024 * 1024; // 8MB
    if (file.size > MAX_SIZE) {
      throw new AppError('validation_error', 'Файл слишком большой (максимум 8MB)');
    }
    if (!file.type.startsWith('image/')) {
      throw new AppError('validation_error', 'Можно загружать только изображения');
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
      // Это ошибка Storage, не Postgres — mapSupabaseError ждёт
      // postgres-коды (23505 и т.п.), поэтому здесь логируем вручную
      // и заворачиваем в generic AppError, а не угадываем код.
      logger.error('gallery.upload_failed', {
        salonId: salon.id,
        path,
        fileSize: file.size,
        fileType: file.type,
        error: uploadError,
      });
      throw new AppError('internal_error', 'Не удалось загрузить файл, попробуйте ещё раз');
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

    if (insertError) throw mapSupabaseError(insertError);

    logger.info('gallery.image_added', { salonId: salon.id, imageId: inserted.id });

    revalidatePath('/admin/storefront');
    return Response.json({ success: true, url: publicUrl, id: inserted.id });

  } catch (err) {
    return errorResponse(err, { route: 'POST /api/salon/gallery' });
  }
}