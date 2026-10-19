function initTocHighlight(): void {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('[data-toc] a[href^="#"]'),
  );

  if (links.length === 0 || !('IntersectionObserver' in window)) return;

  const linksById = new Map<string, HTMLAnchorElement[]>();

  for (const link of links) {
    const id = decodeURIComponent(link.hash.slice(1));
    if (!id) continue;

    const current = linksById.get(id);
    if (current) current.push(link);
    else linksById.set(id, [link]);
  }

  const headings = Array.from(
    document.querySelectorAll<HTMLElement>('h2[id], h3[id]'),
  ).filter((heading) => linksById.has(heading.id));

  if (headings.length === 0) return;

  const setActive = (id: string | null) => {
    for (const link of links) {
      link.removeAttribute('aria-current');
    }

    if (!id) return;
    for (const link of linksById.get(id) ?? []) {
      link.setAttribute('aria-current', 'location');
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        setActive(visible[0].target.id);
      }
    },
    {
      rootMargin: '-88px 0px -65% 0px',
      threshold: 0,
    },
  );

  for (const heading of headings) {
    observer.observe(heading);
  }

  for (const link of links) {
    link.addEventListener('click', () => {
      const id = decodeURIComponent(link.hash.slice(1));
      if (id) setActive(id);
    });
  }

  if (location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    if (linksById.has(id)) setActive(id);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTocHighlight, {
    once: true,
  });
} else {
  initTocHighlight();
}
