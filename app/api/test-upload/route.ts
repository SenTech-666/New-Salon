// app/api/test-upload/route.ts
//
// ВРЕМЕННЫЙ диагностический route handler.
// Цель: проверить, виснет ли supabase.storage.upload() внутри обычного
// API route так же, как внутри Server Action. Если здесь быстро —
// проблема специфична для Server Actions. Если тоже виснет — проблема
// в самом клиенте/окружении, не в Server Actions как таковых.
//
// УДАЛИТЬ после диагностики.

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data: salon } = await supabase
    .from('salons')
    .select('id')
    .eq('owner_clerk_id', userId)
    .single();

  if (!salon) {
    return Response.json({ error: 'Salon not found' }, { status: 404 });
  }

  const testBuffer = Buffer.from('hello from route handler test');
  const path = `${salon.id}/test-route-${Date.now()}.txt`;

  console.log('=== ROUTE HANDLER: начинаю upload ===');
  const t0 = Date.now();

  const { data, error } = await supabase.storage
    .from('salon-media')
    .upload(path, testBuffer, { contentType: 'text/plain' });

  const elapsed = Date.now() - t0;
  console.log(`=== ROUTE HANDLER: upload занял ${elapsed}ms ===`);

  if (error) {
    console.log('=== ROUTE HANDLER: ошибка ===', JSON.stringify(error, null, 2));
    return Response.json({ error: error.message, elapsed }, { status: 500 });
  }

  return Response.json({ success: true, data, elapsed });
}