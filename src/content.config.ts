import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import registeredCollections from "./lib/registered-collections.json";

const registeredTitles = Object.values(registeredCollections) as [
  string,
  ...string[],
];

const gallery = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/gallery" }),
  schema: z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    image: z.string(),
    date: z.union([z.date(), z.string()]),
    location: z.string().optional(),
    collection: z.enum(registeredTitles),
    width: z.number().optional(),
    height: z.number().optional(),
  }),
});

const family = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/family" }),
  schema: z.object({
    title: z.string().optional(),
    image: z.string(),
    date: z.union([z.date(), z.string()]).optional(),
  }),
});

export const collections = {
  gallery,
  family,
};
