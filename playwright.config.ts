import { defineConfig, devices } from '@playwright/test'

const BASE_URL = 'http://localhost:5180'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // The mock takes its language from the browser; texts in specs are Russian.
    locale: 'ru-RU',
    // Without a place filter the map opens where the time zone says; the demo
    // offers are in Moscow and Belgrade, so the specs do not depend on the machine.
    timezoneId: 'Europe/Moscow',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],

  webServer: {
    command: 'pnpm dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
})
