// lib/upload-helper.ts
import { execFile } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const IS_WINDOWS = process.platform === 'win32';

export async function uploadToSupabase(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<{ error: Error | null }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  if (IS_WINDOWS) {
    return uploadViaPowershell(uploadUrl, buffer, contentType, serviceKey);
  } else {
    return uploadViaFetch(uploadUrl, buffer, contentType, serviceKey);
  }
}

async function uploadViaFetch(
  url: string,
  buffer: Buffer,
  contentType: string,
  key: string
): Promise<{ error: Error | null }> {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: new Uint8Array(buffer),
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: new Error(`Supabase error ${res.status}: ${text}`) };
    }
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

async function uploadViaPowershell(
  url: string,
  buffer: Buffer,
  contentType: string,
  key: string
): Promise<{ error: Error | null }> {
  const tmpFile = join(tmpdir(), `upload-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);

  try {
    await writeFile(tmpFile, buffer);

    const escapedPath = tmpFile.replace(/\\/g, '\\\\');

    // Важно: не используем $body/$code — PowerShell путает с drive-переменными.
    // Используем $respText и $statusCode.
    const script = [
      `$fileBytes = [System.IO.File]::ReadAllBytes('${escapedPath}')`,
      `try {`,
      `  $psResp = Invoke-WebRequest -Uri '${url}' -Method PUT -Body $fileBytes \``,
      `    -Headers @{ 'Authorization' = 'Bearer ${key}'; 'x-upsert' = 'true' } \``,
      `    -ContentType '${contentType}' -UseBasicParsing`,
      `  Write-Output "OK:$($psResp.StatusCode)"`,
      `} catch {`,
      `  $statusCode = $_.Exception.Response.StatusCode.value__`,
      `  Write-Output "ERR:$statusCode"`,
      `}`,
    ].join('\n');

    const { stdout, stderr } = await execFileAsync('powershell.exe', [
      '-NonInteractive', '-NoProfile', '-Command', script
    ], { timeout: 30000 });

    const out = stdout.trim();
    console.log('=== PS stdout:', out);
    if (stderr) console.log('=== PS stderr:', stderr.trim());

    if (out.startsWith('OK:')) {
      return { error: null };
    } else {
      return { error: new Error(`PowerShell upload failed: ${out}`) };
    }
  } catch (err) {
    console.log('=== PS exception:', (err as Error).message?.slice(0, 200));
    return { error: err as Error };
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}
