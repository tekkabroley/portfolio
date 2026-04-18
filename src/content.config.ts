import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    link: z.string().url(),
    github: z.string().url().optional(),
    image: z.string(),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/gallery' }),
  schema: z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    image: z.string(),
    date: z.union([z.date(), z.string()]),
    location: z.string().optional(),
    collection: z.string().optional(),
  }),
});

export const collections = {
  'projects': projects,
  'gallery': gallery,
};
