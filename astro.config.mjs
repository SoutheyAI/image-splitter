import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://imgsplitter.com",
  integrations: [
    tailwind(),
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          ja: 'ja-JP',
          ko: 'ko-KR',
          de: 'de-DE',
          fr: 'fr-FR',
          it: 'it-IT'
        },
      },
    }),
    react(),
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ja", "ko", "de", "fr", "it"],
    routing: {
      prefixDefaultLocale: false
    }
  }
});
