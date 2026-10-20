import { existsSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

function remove(path) {
  if (!existsSync(path)) return;

  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const target = join(path, entry.name);

    if (entry.isDirectory()) remove(target);
    else unlinkSync(target);
  }

  rmdirSync(path);
}

remove(process.argv[2] ?? 'dist');
