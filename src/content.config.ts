import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { tagNames } from './data/tags';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/index.{md,mdx}',
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1).max(80),
        description: z.string().min(20).max(160),
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        tags: z.array(z.enum(tagNames)).max(3).default([]),
        draft: z.boolean().default(false),
        lang: z.enum(['zh-CN', 'en']).default('zh-CN'),
        cover: image().optional(),
        coverAlt: z.string().min(1).optional(),
        canonical: z.string().url().optional(),
        series: z
          .object({
            name: z.string().min(1),
            order: z.number().int().positive(),
          })
          .optional(),
      })
      .superRefine((data, ctx) => {
        if (data.cover && !data.coverAlt) {
          ctx.addIssue({
            code: 'custom',
            path: ['coverAlt'],
            message: 'coverAlt is required when cover is set',
          });
        }
        if (data.updatedDate && data.updatedDate < data.pubDate) {
          ctx.addIssue({
            code: 'custom',
            path: ['updatedDate'],
            message: 'updatedDate must be >= pubDate',
          });
        }
      }),
});

export const collections = { blog };
