import assert from 'node:assert/strict';

const base = process.argv[2] ?? 'https://blog.chronicleiras.top';
async function get(path) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, `${path}: ${response.status}`);
  return response;
}
const home = await get('/');
const csp = home.headers.get('content-security-policy');
assert.match(csp, /nonce-/);
assert.equal(csp.split('default-src').length, 2, 'Duplicate CSP policies');
const html = await home.text();
assert.match(html, /黑ICP备2026013426号-1/);
assert.match(html, /黑公网安备23023002230262号/);
assert.match(html, /Chronicle-IRAS/);
assert.match(await (await get('/sitemap-index.xml')).text(), /https:\/\/blog\.chronicleiras\.top\/sitemap-0.xml/);
const sitemap = await (await get('/sitemap-0.xml')).text();
assert(!sitemap.includes('localhost'));
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&'));
for (const location of locations) {
  assert.equal(new URL(location).origin, new URL(base).origin);
  await get(location);
}
const manifest = await (await get('/site.webmanifest')).json();
assert.equal(manifest.start_url, '/');
for (const icon of manifest.icons) await get(icon.src);
await get('/rss.xml');
await get('/og/default.png');
assert.equal((await (await get('/api/health/')).json()).ok, true);
assert.equal((await fetch(new URL('/admin/', base))).status, 404);
const login = await get('/login/');
assert(login.headers.get('set-cookie')?.includes('deskbox_csrf'));
assert.match(await login.text(), /action="\/api\/login\/"/);
const rejected = await fetch(new URL('/api/login/', base), {
  method: 'POST', redirect: 'manual',
  body: new URLSearchParams({ username: 'deployment-smoke-invalid', password: 'invalid', csrf: 'invalid' }),
});
assert.equal(rejected.status, 303);
assert.match(rejected.headers.get('location'), /error=csrf/);
console.log(JSON.stringify({ base, sitemapPages: locations.length, articles: locations.filter((x) => new URL(x).pathname.startsWith('/blog/') && new URL(x).pathname !== '/blog/').length, result: 'passed' }));
