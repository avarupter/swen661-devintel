/**
 * Stand-in for Vite's `import.meta.env` under Jest.
 *
 * babel.config.cjs rewrites every `import.meta.env` in the app to
 * `globalThis.__VITE_ENV__`. polyfills.ts installs these defaults before any
 * module loads, and setup.ts restores them before every test.
 *
 * Code that reads a value at call time (registerSW reads PROD) sees a change
 * made with `setViteEnv` straight away. Code that reads it at import time
 * (ChatBot builds its edge-function URL once) only sees values that were set
 * before the module was first imported — set them in `beforeAll` and import
 * the module dynamically there (see ChatBot.unconfigured.test.tsx).
 */

declare global {
  // Only `var` declares a property of globalThis.
  // eslint-disable-next-line no-var
  var __VITE_ENV__: ImportMetaEnv;
}

export const DEFAULT_VITE_ENV: Readonly<ImportMetaEnv> = Object.freeze({
  BASE_URL: '/',
  MODE: 'test',
  DEV: true,
  PROD: false,
  SSR: false,
  // A configured Supabase project, so ChatBot calls a real-looking URL.
  VITE_SUPABASE_URL: 'https://test-project.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
});

/** Overrides some `import.meta.env` values for the rest of the current test. */
export function setViteEnv(overrides: Partial<ImportMetaEnv>): void {
  Object.assign(globalThis.__VITE_ENV__, overrides);
}

/** Restores the defaults (setup.ts calls this before every test). */
export function resetViteEnv(): void {
  globalThis.__VITE_ENV__ = { ...DEFAULT_VITE_ENV };
}
