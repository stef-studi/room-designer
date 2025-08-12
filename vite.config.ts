import { defineConfig } from 'vite';

// Basic Vite configuration for a vanilla TypeScript project.
// This file can be extended to customize the dev server, plugins or build options.
export default defineConfig({
  root: '.',
  server: {
    open: true,
  },
});
