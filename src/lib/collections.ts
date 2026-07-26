import monochromesConfig from "../config/monochromes.json";
import portlandConfig from "../config/portland.json";
import type { GallerySlot } from "./gallery";

export type CollectionConfig = {
  title: string;
  slots: GallerySlot[];
};

export const COLLECTIONS: Record<string, CollectionConfig> = {
  portland: { title: "Portland", slots: portlandConfig.slots },
  monochromes: { title: "Monochromes", slots: monochromesConfig.slots },
};

export const DEFAULT_COLLECTION = "portland";
