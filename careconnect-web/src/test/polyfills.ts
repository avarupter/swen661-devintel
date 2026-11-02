// Runs before every test file, ahead of any module import (jest `setupFiles`).
import { TextDecoder, TextEncoder } from 'node:util';
import { resetViteEnv } from './viteEnv';

// react-router 7 calls `new TextEncoder()` at module scope, and jsdom does not
// provide TextEncoder / TextDecoder, so importing the router would throw
// "ReferenceError: TextEncoder is not defined". Borrow Node's implementations.
if (typeof globalThis.TextEncoder === 'undefined') {
  Object.assign(globalThis, { TextEncoder, TextDecoder });
}

// `import.meta.env` stand-in — must exist before ChatBot.tsx is imported,
// because it reads the Supabase URL at module scope.
resetViteEnv();
