// test-upload.mjs
// Запуск: node test-upload.mjs
// Изолированный тест: проверяем, может ли чистый Node.js (без Next.js/
// Server Actions) загрузить файл в Supabase Storage. Это разделит
// проблему: либо дело в Node.js/сети вообще, либо специфично для
// Server Actions/Next.js окружения.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Не найдены переменные окружения. Запустите так:');
  console.error('  node --env-file=.env.local test-upload.mjs');
  process.exit(1);
}

console.log('URL:', SUPABASE_URL);
console.log('Key (первые 20 символов):', SUPABASE_KEY.slice(0, 20) + '...');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Большой тестовый буфер (~2.4MB), чтобы проверить, не размер тела
// вызывает зависание, а не специфика Next.js/Server Actions
const testBuffer = Buffer.alloc(2_400_000, 'a');

console.log('Начинаю upload...');
const start = Date.now();

try {
  const { data, error } = await supabase.storage
    .from('salon-media')
    .upload(`test/test-${Date.now()}.txt`, testBuffer, {
      contentType: 'text/plain',
    });

  const elapsed = Date.now() - start;
  console.log(`Завершено за ${elapsed}ms`);

  if (error) {
    console.error('Ошибка от Supabase:', error);
  } else {
    console.log('Успех! Данные:', data);
  }
} catch (err) {
  const elapsed = Date.now() - start;
  console.error(`Исключение за ${elapsed}ms:`, err);
}
