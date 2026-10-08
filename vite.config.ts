import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the built site works from any sub-folder
  // (e.g. GitHub Pages at https://<user>.github.io/<repo>/).
  base: './',
  build: {
    // The certificate template must stay a separate, untouched file (never inlined as base64).
    assetsInlineLimit: 0,
  },
});
