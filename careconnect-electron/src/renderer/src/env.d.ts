/// <reference types="vite/client" />
import type { CareConnectApi } from '../../shared/api'

declare global {
  interface Window {
    /** Exposed by the preload. Absent only when the renderer runs outside Electron. */
    careconnect?: CareConnectApi
  }
}

export {}
