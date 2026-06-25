// app/api/salon/photo/route.ts
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
    const type = formData.get('type') as string;
    const file = formData.get('file') as File | null;

    if (type !== 'photo' && type !== 'cover') {
      throw new AppError('validation_error', 'Неверный тип фото');
    }
    if (!file || file.size === 0) {
      throw new AppError('validation_error', 'Файл не выбран');
    }

    const MAX_SIZE = 8 * 1024 * 1024; // 8MB
    if (file.size > MAX_SIZE) {
      throw new AppError('validation_error', 'Файл слишком большой (максимум 8MB)');
    }
    if (!file.type.startsWith('image/')) {
      throw new AppError('validation_error', 'Можно загружать только изображения');
    }

    const ext = file.name.split('.').pop();
    const path = `${salon.id}/${type}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Было: console.log('=== ROUTE: начинаю upload ===') до и после.
    // logger.debug ничего не пишет в продакшене (см. lib/logger.ts),
    // так что временные замеры скорости не будут засорять прод-логи,
    // но останутся видны при локальной разработке.
    const tUp = Date.now();
    logger.debug('photo.upload_started', { salonId: salon.id, type, platform: process.platform });

    const { error: uploadError } = await uploadToSupabase(
      'salon-media',
      path,
      buffer,
      file.type
    );

    const uploadMs = Date.now() - tUp;
    logger.debug('photo.upload_finished', { salonId: salon.id, type, uploadMs });

    if (uploadError) {
      logger.error('photo.upload_failed', {
        salonId: salon.id,
        type,
        path,
        uploadMs,
        fileSize: file.size,
        error: uploadError,
      });
      throw new AppError('internal_error', 'Не удалось загрузить файл, попробуйте ещё раз');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('salon-media')
      .getPublicUrl(path);

    const field = type === 'photo' ? 'photo_url' : 'cover_url';
    const { error: updateError } = await supabase
      .from('salons')
      .update({ [field]: publicUrl })
      .eq('id', salon.id);

    if (updateError) throw mapSupabaseError(updateError);

    logger.info('photo.updated', { salonId: salon.id, type });

    revalidatePath('/admin/storefront');
    return Response.json({ success: true, url: publicUrl });

  } catch (err) {
    return errorResponse(err, { route: 'POST /api/salon/photo' });
  }
}