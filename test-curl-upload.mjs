// test-curl-upload.mjs — загрузка через curl.exe (встроен в Windows 10/11)
import { randomBytes } from 'crypto';
import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Нет переменных окружения');
  process.exit(1);
}

console.log('URL:', SUPABASE_URL);
console.log('Key (первые 20 символов):', SUPABASE_KEY.slice(0, 20) + '...');

// Генерируем тестовый файл ~2.4 МБ и сохраняем во временный файл
const testData = randomBytes(Math.round(2.4 * 1024 * 1024));
const tmpFile = join(tmpdir(), `test-upload-${Date.now()}.bin`);
writeFileSync(tmpFile, testData);

const objectName = `test-curl-${Date.now()}.bin`;
const uploadUrl = `${SUPABASE_URL}/storage/v1/object/salon-photos/${objectName}`;

console.log(`\nЗагружаю ${(testData.length / 1024 / 1024).toFixed(2)} МБ через curl.exe...`);
console.log('URL:', uploadUrl);

const start = Date.now();
try {
  const result = execSync(
    `curl.exe -s -o - -w "\\nHTTP_STATUS:%{http_code}\\nTIME:%{time_total}" ` +
    `-X PUT "${uploadUrl}" ` +
    `-H "Authorization: Bearer ${SUPABASE_KEY}" ` +
    `-H "Content-Type: application/octet-stream" ` +
    `-H "x-upsert: true" ` +
    `--data-binary "@${tmpFile}"`,
    { encoding: 'utf8', timeout: 60000 }
  );
  const elapsed = Date.now() - start;
  console.log(`\n✅ curl завершился за ${elapsed}ms`);
  console.log('Вывод:', result);
} catch (err) {
  const elapsed = Date.now() - start;
  console.log(`\n❌ curl ошибка за ${elapsed}ms`);
  console.log(err.stdout || err.message);
} finally {
  try { unlinkSync(tmpFile); } catch {}
}
