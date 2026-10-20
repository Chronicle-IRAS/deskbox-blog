import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const OUTPUT = 'deploy/csp-hashes.json';
const check = process.argv.includes('--check');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const hashes = new Set();

for (const file of walk(DIST).filter((path) => path.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');

  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attributes = match[1];

    if (/\bsrc=/.test(attributes)) continue;
    if (/application\/ld\+json/.test(attributes)) continue;

    const digest = createHash('sha256').update(match[2], 'utf8').digest('base64');
    hashes.add(`'sha256-${digest}'`);
  }
}

const sorted = [...hashes].sort();

if (check) {
  if (!existsSync(OUTPUT)) {
    console.error(`Missing ${OUTPUT}. Run "npm run csp" after building.`);
    process.exit(1);
  }

  const expected = JSON.parse(readFileSync(OUTPUT, 'utf8')).hashes;

  if (JSON.stringify(expected) !== JSON.stringify(sorted)) {
    console.error('CSP hashes are stale. Run "npm run csp" and update deploy files.');
    console.error('Expected:', expected);
    console.error('Actual:  ', sorted);
    process.exit(1);
  }

  console.log(`CSP hashes match (${sorted.length}).`);
} else {
  mkdirSync('deploy', { recursive: true });
  writeFileSync(OUTPUT, `${JSON.stringify({ hashes: sorted }, null, 2)}\n`);
  console.log(`Wrote ${sorted.length} CSP hashes to ${OUTPUT}.`);
  for (const hash of sorted) console.log(hash);
}
