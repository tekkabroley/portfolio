import { photos as familyPhotos } from "../_data/family-photos.js";
import { verifySession } from "../_lib/session.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const session = await verifySession(request, env);

  if (!session.ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  }

  const photos = familyPhotos.map((photo) => ({
    src: `/api/family-image?path=${encodeURIComponent(photo.path)}`,
    alt: photo.alt,
  }));

  return new Response(JSON.stringify({ photos }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
    },
  });
}
