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
    title: z.string(),
    category: z.string(),
    image: z.string(),
    date: z.date(),
  }),
});

export const collections = {
  'projects': projects,
  'gallery': gallery,
};
