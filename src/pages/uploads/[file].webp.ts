export const prerender = false;
import type { APIContext } from 'astro';
import { readUpload } from '../../server/uploads';

export async function GET({ params }: APIContext): Promise<Response> {
  return readUpload(`${params.file ?? ''}.webp`);
}
