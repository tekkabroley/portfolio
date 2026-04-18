# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- Install dependencies: `npm install`
- Start local dev server: `npm run dev` (runs at `localhost:4321`)
- Build for production: `npm run build`
- Preview production build: `npm run preview`
- Astro CLI commands: `npm run astro [command]` (e.g., `npm run astro check`)

## Architecture

The repository contains a photography portfolio built with Astro 6.0 and Tailwind CSS.

### Root Project Structure
- `src/pages/`: Defines the site's routing based on file names.
- `src/layouts/`: Contains reusable page wrappers.
- `src/components/`: Reusable UI components.
- `src/content/`: Utilizes Astro Content Collections for managing photography gallery items with Zod-based type safety.
- `src/styles/`: Global styles and Tailwind configurations.
- `public/`: Static assets.

### Core Design Principles
- **Island Architecture**: Minimizes client-side JavaScript to optimize Time to Interactive (TTI).
- **Content Collections**: Treats content as first-class citizens for optimized build processes.
- **Image Optimization**: Leverages Astro's built-in image support for automated compression and modern format delivery (WebP/Avif).
- **Tailwind JIT**: Uses a utility-first CSS approach to ensure minimal production CSS bundles.

### Other Projects
- `extinct-escape/`: A separate Astro project located within the main repository.
