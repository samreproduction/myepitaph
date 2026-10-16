import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  // PBKDF2 for nine files precedes the existing four-second growth animation.
  expect: { timeout: 15000 },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: process.env.PW_EXECUTABLE_PATH
      ? { executablePath: process.env.PW_EXECUTABLE_PATH }
      : { channel: 'msedge' },
  },
  webServer: {
    command: 'npm run build:test && npm run preview -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
