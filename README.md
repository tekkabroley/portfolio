# Photography Portfolio

A photography portfolio for [Alex Broley](https://portfolio-7ix.pages.dev/), built with Astro and Tailwind CSS. The site is optimized for image-heavy pages, organized into themed collections, and includes a PIN-protected family gallery.

## Features

- **Collection galleries** — Curated photo grids for Portland and Monochromes, each driven by a layout config in `src/config/`
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
| `npm run build` | Build the production site to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run astro check` | Run Astro type and content checks |

## Project Structure

```text
/
├── functions/              # Cloudflare Pages Functions (family auth, S3 proxy)
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

   This reads each gallery entry's `collection` field and appends a slot to the matching config file in `src/config/` (e.g. `portland.json`). Existing configs and slots are preserved; only new photos are added.

3. If the collection is new, register it in `src/lib/collections.ts` so a page is generated at `/{collection}`.

The home page (`/`) defaults to the Portland collection.

## Deployment

The site is deployed to Cloudflare Pages. Serverless functions in `functions/` require the following environment variables:

| Variable | Used by |
| --- | --- |
| `FAMILY_PIN` | Family gallery login |
| `AWS_ACCESS_KEY_ID` | Private family image proxy |
| `AWS_SECRET_ACCESS_KEY` | Private family image proxy |
| `AWS_REGION` | Private family image proxy |
| `PRIVATE_S3_BUCKET` | Private family image proxy |

## License

Private project. All photography is copyright Alex Broley.
