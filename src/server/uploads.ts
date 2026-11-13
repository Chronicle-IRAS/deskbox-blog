import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import sharp, { type OutputInfo } from 'sharp';

export function uploadDirectory(): string {
  return join(process.env.BLOG_DATA_DIR ?? 'shared', 'uploads');
}
const MEDIA_TYPES: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
};

export function isUploadFilename(name: string): boolean {
  // Explicit endpoint extensions must stay lowercase under Astro trailingSlash rules.
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\.(?:png|jpe?g|webp)$/.test(name);
}

/** Both original imported raster images and content-addressed uploads use this reader. */
export async function readUpload(name: string): Promise<Response> {
  if (!isUploadFilename(name)) return new Response('Not found', { status: 404 });
  try {
    const root = await realpath(uploadDirectory());
    const target = join(root, name);
    const stat = await lstat(target);
    // Never expose a symlink target, even if its name has an allowed image extension.
    if (!stat.isFile() || stat.isSymbolicLink()) return new Response('Not found', { status: 404 });
    const resolved = await realpath(target);
    if (dirname(resolved) !== root) return new Response('Not found', { status: 404 });
    const data = await readFile(resolved);
    return new Response(new Uint8Array(data), { headers: {
      'Content-Type': MEDIA_TYPES[extname(name).toLowerCase()],
      'X-Content-Type-Options': 'nosniff',
      // Imported filenames may be overwritten by a later import.
      'Cache-Control': /^[a-f0-9]{24}\.webp$/.test(name)
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
    } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp']);

export interface SavedUpload {
  path: string;
  width: number;
  height: number;
}

export async function saveUpload(file: File): Promise<SavedUpload> {
  if (!ALLOWED.has(file.type)) {
    throw new Error('只支持 PNG、JPEG、WebP 图片');
  }

  if (file.size > MAX_BYTES) {
    throw new Error('图片不能超过 5 MB');
  }

  const input = Buffer.from(await file.arrayBuffer());

  let output: Buffer;
  let info: OutputInfo;

  try {
    const result = await sharp(input)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    output = result.data;
    info = result.info;
  } catch {
    throw new Error('无法读取这张图片');
  }

  const hash = createHash('sha256').update(output).digest('hex').slice(0, 24);
  const name = `${hash}.webp`;

  const directory = uploadDirectory();
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, name), output);

  return {
    path: `/uploads/${name}`,
    width: info.width,
    height: info.height,
  };
}
