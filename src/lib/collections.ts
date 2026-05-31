import birdsConfig from "../config/birds.json";
import bridgesConfig from "../config/bridges.json";
import sellwoodConfig from "../config/sellwood.json";
import tunnelsConfig from "../config/tunnels.json";
import type { GallerySlot } from "./gallery";

export type CollectionConfig = {
  title: string;
  slots: GallerySlot[];
};

export const COLLECTIONS: Record<string, CollectionConfig> = {
  sellwood: { title: "Sellwood", slots: sellwoodConfig.slots },
  birds: { title: "Birds", slots: birdsConfig.slots },
  bridges: { title: "Bridges", slots: bridgesConfig.slots },
  tunnels: { title: "Tunnels", slots: tunnelsConfig.slots },
};

export const DEFAULT_COLLECTION = "sellwood";
