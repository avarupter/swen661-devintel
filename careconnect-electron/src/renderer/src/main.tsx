import '@fontsource-variable/inter'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { CareConnectApi } from '../../shared/api'
import { App } from './App'

const container = document.getElementById('root')
if (!container) throw new Error('index.html is missing the #root element')
const root = createRoot(container)

/**
 * The desktop app always has the preload bridge. Opened in a plain browser
 * through the dev server (`npm run dev:web`, for axe DevTools in Chrome), a
 * development build falls back to the browser preview; the dynamic import
 * keeps that code out of production bundles.
 */
async function resolveApi(): Promise<{ api: CareConnectApi; browserPreview: boolean } | null> {
  if (window.careconnect) return { api: window.careconnect, browserPreview: false }
  if (import.meta.env.DEV) {
    const { createBrowserPreviewApi } = await import('./api/browserPreviewApi')
    return { api: createBrowserPreviewApi(), browserPreview: true }
  }
  return null
}

void resolveApi().then((resolved) => {
  root.render(
    <StrictMode>
      {resolved ? (
        <App api={resolved.api} initialUi={{ browserPreview: resolved.browserPreview }} />
      ) : (
        <p className="app-message" role="alert">
          CareConnect must be started from the desktop app.
        </p>
      )}
    </StrictMode>
  )
})
