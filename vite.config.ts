/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works on GitHub Pages (/Startup-Survivor/) and any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { include: ['tests/engine/**/*.test.ts'] },
});
