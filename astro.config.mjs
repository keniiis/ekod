import { defineConfig } from 'astro/config';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node'; // Import the node adapter

export default defineConfig({
  integrations: [
    tailwind(),
    react(),
    mdx()
  ],
  output: 'server', // Enable server-side rendering for API routes
  adapter: node({ // Add the node adapter
    mode: 'standalone' // Or 'middleware' depending on deployment needs
  })
});
