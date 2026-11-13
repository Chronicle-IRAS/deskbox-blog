// 构建期生成极小的模糊占位图（16px 宽 webp，data URI，约 200 字节）
import sharp from 'sharp';

const cache = new Map();
export async function blurDataURI(fsPath) {
  if (!fsPath) return '';
  if (cache.has(fsPath)) return cache.get(fsPath);
  const p = sharp(fsPath)
    .resize(16, 16, { fit: 'inside' })
    .webp({ quality: 45 })
    .toBuffer()
    .then((b) => `data:image/webp;base64,${b.toString('base64')}`)
    .catch(() => '');
  cache.set(fsPath, p);
  return p;
}
