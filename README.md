# Photography Portfolio

A photography portfolio for [Alex Broley](https://portfolio-7ix.pages.dev/), built with Astro and Tailwind CSS. The site is optimized for image-heavy pages, organized into themed collections, and includes a PIN-protected family gallery.

## Features

- **Collection galleries** — Curated photo grids (currently Portland) driven by layout configs in `src/config/`
- **Content collections** — Gallery and family photos are managed as typed Markdown frontmatter with Zod validation
- **Image optimization** — Astro serves remote S3 images with automatic compression and modern formats (WebP/AVIF)
- **Minimal client JavaScript** — Gallery lightbox is the primary client-side interaction; everything else is static HTML
- **Private family gallery** — PIN-protected section with Cloudflare Functions serving images from a private S3 bucket

## Tech Stack

- [Astro 6](https://astro.build/) — Static site generation with island architecture
- [Tailwind CSS 4](https://tailwindcss.com/) — Utility-first styling
- [Cloudflare Pages](https://pages.cloudflare.com/) — Hosting and serverless functions
- [AWS S3](https://aws.amazon.com/s3/) — Photo storage (public gallery + private family bucket)

## Getting Started

**Requirements:** Node.js 22.12 or later

```bash
npm install
npm run dev
```

The dev server runs at [http://localhost:4321](http://localhost:4321).

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Generate family data, validate gallery configs, then build to `dist/` |
| `npm run generate:family` | Sync `functions/_data/family-photos.js` from `src/content/family/` |
| `npm run validate:gallery` | Fail if registered collection configs and gallery markdown drift apart |
| `npm run preview` | Preview the production build locally (static only; family APIs need Pages Functions) |
| `npm run astro check` | Run Astro type and content checks |

## Project Structure

```text
/
├── functions/              # Cloudflare Pages Functions (family auth, S3 proxy)
│   ├── _lib/               # Shared session + path helpers
│   ├── _data/              # Generated family allowlist / photo list
│   ├── api/                # PIN login, photo list, image proxy
│   └── family/             # Auth middleware for /family
├── public/                 # Static assets
├── scripts/                # Build and maintenance scripts
├── src/
│   ├── assets/             # Local images (logo, gear photos, etc.)
│   ├── components/         # Reusable UI components
│   ├── config/             # Per-collection gallery layout configs
│   ├── content/
│   │   ├── gallery/        # Public gallery photo entries (.md)
│   │   └── family/         # Private family photo entries (.md)
│   ├── layouts/            # Page layouts
│   ├── lib/                # Shared gallery and collection utilities
│   ├── pages/              # File-based routes
│   └── styles/             # Global CSS and Tailwind
└── extinct-escape/         # Separate Astro project (see its own README)
```

## Adding Gallery Photos

1. Add a Markdown file to `src/content/gallery/` named after the image slug (e.g. `DSC01633.md`):

   ```yaml
   ---
   date: 2025:09:30 17:47:34
   image: https://example.s3.amazonaws.com/gallery/DSC01633.jpg
   location: Portland, OR
   collection: Portland
   width: 6336
   height: 9504
   ---
   ```

2. Run the collection config generator to create or update the layout config for that collection:

   ```bash
   node scripts/generate-collection-configs.mjs
   ```

   This only updates collections listed in `src/lib/registered-collections.json`. Existing configs and slots are preserved; only new photos are added.

3. If the collection is new:
   - Add its slug/title to `src/lib/registered-collections.json`
   - Import its layout config in `src/lib/collections.ts`
   - Ensure gallery markdown uses that collection title

4. Run `npm run validate:gallery` (also part of `npm run build`) to confirm config slots and markdown stay in sync.

Empty registered collections are omitted from the sidebar until they have slots. The home page (`/`) defaults to Portland.

To bring back Monochromes later: add gallery entries with `collection: Monochromes`, register `monochromes` in `registered-collections.json`, add `src/config/monochromes.json`, import it in `collections.ts`, then run the config generator.

## Adding Family Photos

1. Add a Markdown file to `src/content/family/` with an `image` URL under the private S3 prefix `family/`.
2. Run `npm run generate:family` (also runs automatically during `npm run build`) to refresh the allowlist and photo list used by Cloudflare Functions.
3. Deploy. Family photo paths are not embedded in static HTML; the `/family` page loads them from `/api/family-photos` after PIN login.

Family auth and image APIs run only on Cloudflare Pages Functions. Plain `astro preview` / `astro dev` will not serve `/api/*` or the family middleware — use a Pages preview deploy (or `wrangler pages dev`) to exercise the private gallery locally.

## Deployment

The site is deployed to Cloudflare Pages. Serverless functions in `functions/` require the following environment variables:

| Variable | Used by |
| --- | --- |
| `FAMILY_PIN` | Family gallery login |
| `SESSION_SECRET` | HMAC-signed family session cookie (long random string) |
| `AWS_ACCESS_KEY_ID` | Private family image proxy |
| `AWS_SECRET_ACCESS_KEY` | Private family image proxy |
| `AWS_REGION` | Private family image proxy |
| `PRIVATE_S3_BUCKET` | Private family image proxy |

Generate `SESSION_SECRET` with something like `openssl rand -hex 32` and set it as a Cloudflare Pages secret. Without it, PIN login fails closed.

## License

Private project. All photography is copyright Alex Broley.
