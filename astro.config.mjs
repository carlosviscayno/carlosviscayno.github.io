import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// User site (repo named carlosviscayno.github.io): no "base" needed.
export default defineConfig({
  site: 'https://carlosviscayno.github.io',
  vite: {
    plugins: [tailwindcss()],
  },
});