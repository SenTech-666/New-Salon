// test-axios-upload.mjs
import { randomBytes } from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Нет переменных окружения');
  process.exit(1);
}

console.log('URL:', SUPABASE_URL);
console.log('Key (первые 20 символов):', SUPABASE_KEY.slice(0, 20) + '...');

const testData = randomBytes(Math.round(2.4 * 1024 * 1024));
const testFileName = `test-axios-${Date.now()}.bin`;

const mod = await import('axios');
const axios = mod.default;

const uploadUrl = `${SUPABASE_URL}/storage/v1/object/salon-photos/${testFileName}`;

console.log(`\nЗагружаю ${(testData.length / 1024 / 1024).toFixed(2)} МБ через axios...`);
const start = Date.now();

try {
  const response = await axios.put(uploadUrl, testData, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/octet-stream',
      'x-upsert': 'true',
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 60000,
  });

  const elapsed = Date.now() - start;
  console.log(`\n✅ Успех за ${elapsed}ms`);
  console.log('Status:', response.status);
  console.log('Data:', JSON.stringify(response.data));
} catch (err) {
  const elapsed = Date.now() - start;
  console.log(`\n❌ Ошибка за ${elapsed}ms`);
  if (err.response) {
    console.log('Status:', err.response.status);
    console.log('Data:', JSON.stringify(err.response.data));
  } else {
    console.log('Error:', err.message);
    if (err.cause) console.log('Cause:', err.cause);
  }
}
