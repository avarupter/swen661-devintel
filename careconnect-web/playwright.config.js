import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against the production build, served under the same
 * subpath GitHub Pages will use, so the relative base ("./") is exercised
 * exactly as deployed. Three projects cover the three layouts: the mobile
 * bottom bar (< 768px), the tablet tabs (768-1199px) and the desktop sidebar.
 * The "evidence" project only takes the 2x screenshots for the team document.
 */
const BASE_URL = "http://localhost:4173/swen661-devintel/";

export default defineConfig({
  testDir: "e2e",
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  webServer: {
    command: "npm run build && npx vite preview --base /swen661-devintel/ --port 4173 --strictPort",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } }, testIgnore: /evidence\.spec\.js/ },
    { name: "tablet", use: { viewport: { width: 1024, height: 768 } }, testIgnore: /evidence\.spec\.js/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /evidence\.spec\.js/ },
    {
      name: "evidence",
      use: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
      testMatch: /evidence\.spec\.js/,
    },
  ],
});
