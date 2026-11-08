import { defineConfig, devices } from '@playwright/test';

// macOS 12 has no Playwright browser downloads: drive the installed Google Chrome.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:4173', channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'], channel: 'chrome', viewport: { width: 375, height: 812 } } },
  ],
  // Set BASE_URL=https://hspector1.github.io/Startup-Survivor/ to test the deployed site instead.
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run build && npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 180_000 },
});
