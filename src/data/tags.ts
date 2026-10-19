export interface Tag {
  name: string;
  slug: string;
  description?: string;
}

export const tags = [
  { name: '前端', slug: 'frontend', description: '浏览器、框架与工程化' },
  { name: '后端', slug: 'backend', description: '服务端、数据与基础设施' },
  { name: '工程实践', slug: 'engineering', description: '协作、测试与交付' },
  { name: '阅读', slug: 'reading', description: '书与长文笔记' },
  { name: '生活', slug: 'life', description: '写作之外' },
] as const satisfies readonly Tag[];

export type TagName = (typeof tags)[number]['name'];

export const tagNames = tags.map((tag) => tag.name) as [TagName, ...TagName[]];

export function tagBySlug(slug: string): Tag | undefined {
  return tags.find((tag) => tag.slug === slug);
}

export function tagSlugByName(name: string): string {
  const tag = tags.find((item) => item.name === name);

  if (!tag) {
    throw new Error(
      `Unknown tag "${name}". Add it to src/data/tags.ts before publishing.`,
    );
  }

  return tag.slug;
}
