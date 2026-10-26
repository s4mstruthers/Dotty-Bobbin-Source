import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig, envField } from 'astro/config';
import wix from "@wix/astro";
import wixPages from "@wix/astro-pages";

import react from "@astrojs/react";
import wixHostingAdapter from "@wix/astro-wix-hosting-adapter";

// https://astro.build/config
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  integrations: [wix(), wixPages(), react()],
  security: { checkOrigin: false },
  adapter: wixHostingAdapter(),

  image: {
    domains: ["static.wixstatic.com"],
  },

  output: "server",

  env: {
    schema: {
      // The secret part of the studio's private bookings calendar link (/api/bookings-feed/<token>.ics).
      // Set on Wix's servers with `wix env set`; without it the feed is switched off.
      BOOKINGS_FEED_TOKEN: envField.string({ context: "server", access: "secret", optional: true }),
      // Google Places API (New) key for the home page's Google reviews (/api/google-reviews). Set on
      // Wix's servers with `wix env set`; without it the section is just a link to the reviews.
      GOOGLE_PLACES_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});