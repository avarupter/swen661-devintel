/**
 * Content-Security-Policy for the renderer.
 *
 * The production policy is sent twice: as a <meta> tag injected into
 * index.html at build time, and as a response header by the app:// protocol
 * handler. The dev-server policy relaxes only what Vite needs (the inline React
 * Refresh preamble and the HMR websocket). Neither allows 'unsafe-eval'.
 */
export const PRODUCTION_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'"
].join('; ')

export const DEV_SERVER_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' ws://localhost:*",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'"
].join('; ')

/** frame-ancestors is ignored (with a console warning) when delivered by <meta>. */
export const META_PRODUCTION_CSP = PRODUCTION_CSP.replace("; frame-ancestors 'none'", '')
