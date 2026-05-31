export type GallerySlot = {
  id: string;
  targetRatio: number;
  width: number;
  height: number;
  layout: string;
  gridClass: string;
  aspectClass: string;
  imageSlug?: string;
};

export type GalleryEntry = {
  id: string;
  slug?: string;
  data: {
    title?: string;
    image: string;
    collection?: string;
  };
};

export function matchPhotosToSlots(
  entries: GalleryEntry[],
  slots: GallerySlot[],
): Record<string, GalleryEntry> {
  const assignments: Record<string, GalleryEntry> = {};

  slots.forEach((slot) => {
    if (slot.imageSlug) {
      const photo = entries.find(
        (p) =>
          p.id.toLowerCase() === slot.imageSlug!.toLowerCase() ||
          (p.slug && p.slug.toLowerCase() === slot.imageSlug!.toLowerCase()),
      );
      if (photo) {
        assignments[slot.id] = photo;
      }
    }
  });

  return assignments;
}
