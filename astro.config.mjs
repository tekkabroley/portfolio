// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'served-photos-556758165742-us-west-2-an.s3.us-west-2.amazonaws.com',
      },
    ],
  },

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: cloudflare()
});