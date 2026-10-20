import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const HASH_FILE = 'deploy/csp-hashes.json';
const POLICY_FILE = 'deploy/csp-policy.txt';
const check = process.argv.includes('--check');

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function collectHashes() {
  const hashes = new Set();

  for (const file of walk(DIST).filter((path) => path.endsWith('.html'))) {
    const html = readFileSync(file, 'utf8');

    for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      const attributes = match[1];

      if (/\bsrc=/.test(attributes)) continue;
      if (/application\/ld\+json/.test(attributes)) continue;

      const digest = createHash('sha256')
        .update(match[2], 'utf8')
        .digest('base64');
      hashes.add(`'sha256-${digest}'`);
    }
  }

  return [...hashes].sort();
}

function commentsEnabled() {
  const source = readFileSync('src/data/site.ts', 'utf8');
  return /comments:\s*\{[^}]*provider:\s*'giscus'/s.test(source);
}

function buildPolicy(hashes, giscus) {
  const scriptSrc = ["'self'", "'wasm-unsafe-eval'", ...hashes];
  const connectSrc = ["'self'"];
  let frameSrc = ["'none'"];

  if (giscus) {
    scriptSrc.push('https://giscus.app');
    connectSrc.push('https://giscus.app');
    frameSrc = ['https://giscus.app'];
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${connectSrc.join(' ')}`,
    "worker-src 'self'",
    `frame-src ${frameSrc.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

const hashes = collectHashes();
const giscus = commentsEnabled();
const policy = buildPolicy(hashes, giscus);

if (check) {
  if (!existsSync(HASH_FILE) || !existsSync(POLICY_FILE)) {
    console.error(`Missing ${HASH_FILE} or ${POLICY_FILE}. Run "npm run csp" after building.`);
    process.exit(1);
  }

  const expectedHashes = JSON.parse(readFileSync(HASH_FILE, 'utf8')).hashes;
  const expectedPolicy = readFileSync(POLICY_FILE, 'utf8').trim();

  if (JSON.stringify(expectedHashes) !== JSON.stringify(hashes)) {
    console.error('CSP hashes are stale. Run "npm run csp".');
    console.error('Expected:', expectedHashes);
    console.error('Actual:  ', hashes);
    process.exit(1);
  }

  if (expectedPolicy !== policy) {
    console.error('CSP policy is stale. Run "npm run csp".');
    process.exit(1);
  }

  for (const file of [
    'dist/_headers',
    'dist/nginx.conf',
    'dist/nginx-security-headers.conf',
  ]) {
    if (!existsSync(file)) {
      console.error(`Missing generated ${file}. Run "npm run build".`);
      process.exit(1);
    }

    if (readFileSync(file, 'utf8').includes('{{')) {
      console.error(`${file} still contains an unresolved placeholder.`);
      process.exit(1);
    }
  }

  for (const file of ['dist/_headers', 'dist/nginx-security-headers.conf']) {
    if (!readFileSync(file, 'utf8').includes(policy)) {
      console.error(`${file} does not contain the generated CSP policy.`);
      process.exit(1);
    }
  }

  if (
    !readFileSync('dist/nginx.conf', 'utf8').includes(
      'include /etc/nginx/snippets/deskbox-security-headers.conf;',
    )
  ) {
    console.error('dist/nginx.conf does not include the security headers snippet.');
    process.exit(1);
  }

  console.log(`CSP hashes and policy match (${hashes.length} hashes).`);
} else {
  mkdirSync('deploy', { recursive: true });
  writeFileSync(
    HASH_FILE,
    `${JSON.stringify({ hashes, comments: giscus ? 'giscus' : 'none' }, null, 2)}\n`,
  );
  writeFileSync(POLICY_FILE, `${policy}\n`);
  console.log(
    `Wrote ${hashes.length} CSP hashes and ${giscus ? 'Giscus-enabled' : 'no-comments'} policy.`,
  );
}
