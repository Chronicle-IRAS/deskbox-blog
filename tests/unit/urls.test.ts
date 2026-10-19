import { describe, expect, it } from 'vitest';
import { canonicalUrl, toAbsoluteUrl } from '../../src/lib/seo';

const BASE = 'http://localhost:4321';

describe('toAbsoluteUrl', () => {
  it('resolves root-relative paths against the site', () => {
    expect(toAbsoluteUrl('/blog/hello-world/', BASE)).toBe(
      `${BASE}/blog/hello-world/`,
    );
  });

  it('keeps absolute URLs unchanged', () => {
    expect(toAbsoluteUrl('https://example.com/note', BASE)).toBe(
      'https://example.com/note',
    );
  });

  it('preserves the trailing slash', () => {
    expect(toAbsoluteUrl('/tags/frontend/', BASE)).toBe(`${BASE}/tags/frontend/`);
  });
});

describe('canonicalUrl', () => {
  it('builds a canonical URL from the pathname', () => {
    expect(canonicalUrl('/blog/astro-content-collections/', BASE)).toBe(
      `${BASE}/blog/astro-content-collections/`,
    );
  });

  it('resolves against a URL base', () => {
    expect(canonicalUrl('/about/', new URL(BASE))).toBe(`${BASE}/about/`);
  });
});
