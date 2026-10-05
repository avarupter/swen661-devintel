import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { DEV_SERVER_CSP, META_PRODUCTION_CSP } from './src/shared/csp'

/** Fills the %CONTENT_SECURITY_POLICY% placeholder in src/renderer/index.html. */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'careconnect-content-security-policy',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        return html.replace('%CONTENT_SECURITY_POLICY%', ctx.server ? DEV_SERVER_CSP : META_PRODUCTION_CSP)
      }
    }
  }
}

export default defineConfig({
  main: {
    build: {
      rollupOptions: { input: { index: resolve(__dirname, 'src/main/index.ts') } }
    }
  },
  preload: {
    build: {
      rollupOptions: { input: { index: resolve(__dirname, 'src/preload/index.ts') } }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: { input: { index: resolve(__dirname, 'src/renderer/index.html') } }
    },
    plugins: [react(), contentSecurityPolicy()]
  }
})
