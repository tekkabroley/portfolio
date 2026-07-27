import portlandConfig from "../config/portland.json";
import registeredCollections from "./registered-collections.json";
import type { GallerySlot } from "./gallery";

export type CollectionConfig = {
  title: string;
  slots: GallerySlot[];
};

const CONFIG_BY_SLUG: Record<string, { slots: GallerySlot[] }> = {
  portland: portlandConfig,
};

export const COLLECTIONS: Record<string, CollectionConfig> = Object.fromEntries(
  Object.entries(registeredCollections).map(([slug, title]) => {
    const config = CONFIG_BY_SLUG[slug];
    if (!config) {
      throw new Error(
        `Registered collection "${slug}" is missing a layout config import.`,
      );
    }
    return [slug, { title, slots: config.slots }];
  }),
);

/** Sidebar order: registered collections that currently have photos. */
export const SIDEBAR_COLLECTIONS = Object.keys(COLLECTIONS).filter(
  (slug) => COLLECTIONS[slug].slots.length > 0,
);

export const DEFAULT_COLLECTION = "portland";
