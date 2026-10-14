/**
 * Serves the React renderer on its own, for testing the screens in a desktop
 * browser (axe DevTools in Chrome, as the Week 9 accessibility testing asks):
 *
 *   npm run dev:web     then open http://localhost:5173 in Chrome
 *
 * With no preload bridge, the development build falls back to the browser
 * preview API (src/renderer/src/api/browserPreviewApi.ts).
 */
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { DEV_SERVER_CSP } from './src/shared/csp'

function contentSecurityPolicy(): Plugin {
  return {
    name: 'careconnect-content-security-policy',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('%CONTENT_SECURITY_POLICY%', DEV_SERVER_CSP)
    }
  }
}

export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  plugins: [react(), contentSecurityPolicy()],
  server: { port: 5173 }
})
