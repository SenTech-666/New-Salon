// test-other-host.mjs
// Запуск: node test-other-host.mjs
//
// Проверяем: воспроизводится ли ECONNRESET при отправке большого тела
// на ДРУГОЙ хост (не Supabase/не Cloudflare), чтобы понять, специфична
// ли проблема для конкретного сервера/CDN, или это общая проблема сети
// при передаче тела определённого размера.

const testBuffer = Buffer.alloc(2_400_000, 'a');

console.log('Тестирую отправку 2.4MB на httpbin.org (POST echo service)...');
const start = Date.now();

try {
  const res = await fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: testBuffer,
  });

  const elapsed = Date.now() - start;
  console.log(`Завершено за ${elapsed}ms, статус: ${res.status}`);
} catch (err) {
  const elapsed = Date.now() - start;
  console.error(`Исключение за ${elapsed}ms:`, err);
}
