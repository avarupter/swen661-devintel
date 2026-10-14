import { builtinModules } from 'node:module'
import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import globals from 'globals'

const nodeBuiltins = [...builtinModules, ...builtinModules.map((name) => `node:${name}`)]

/**
 * Process boundaries are enforced here, not just described in the README:
 * the renderer is sandboxed and may only reach the main process through the
 * preload bridge, and shared code must run unchanged in both processes.
 */
const rendererBoundary = {
  paths: [
    { name: 'electron', message: 'The renderer is sandboxed. Use the window.careconnect bridge from the preload.' },
    ...nodeBuiltins.map((name) => ({ name, message: 'Node built-ins are not available in the sandboxed renderer.' }))
  ],
  patterns: [
    { group: ['**/main/**', '**/preload/**'], message: 'The renderer may import only renderer and shared code.' }
  ]
}

const sharedBoundary = {
  paths: [
    { name: 'electron', message: 'Shared code runs in every process; keep Electron out of it.' },
    { name: 'react', message: 'Shared code must not depend on React.' },
    ...nodeBuiltins.map((name) => ({ name, message: 'Shared code must not depend on Node built-ins.' }))
  ],
  patterns: [
    { group: ['**/main/**', '**/preload/**', '**/renderer/**'], message: 'Shared code may import only shared code.' }
  ]
}

export default defineConfig([
  globalIgnores(['out/**', 'dist/**', 'coverage/**', 'screens/**', 'build/**', 'resources/**', '.idea/**']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{cjs,mjs,js}', 'electron.vite.config.ts', 'vite.web.config.ts', 'scripts/**'],
    languageOptions: { globals: globals.node }
  },
  {
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' }
  },
  {
    files: ['src/main/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/renderer/**', '**/preload/**'], message: 'Main may import only main and shared code.' }] }
      ]
    }
  },
  {
    files: ['src/preload/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: nodeBuiltins.map((name) => ({ name, message: 'Sandboxed preloads cannot load Node built-ins.' })),
          patterns: [{ group: ['**/main/**', '**/renderer/**'], message: 'Preload may import only shared code.' }]
        }
      ]
    }
  },
  {
    files: ['src/shared/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', sharedBoundary] }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    ...reactHooks.configs.flat['recommended-latest']
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    ...jsxA11y.flatConfigs.strict
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', rendererBoundary] }
  },
  {
    files: ['**/__tests__/**', 'tests/**'],
    languageOptions: { globals: { ...globals.jest, ...globals.node } },
    rules: { 'no-restricted-imports': 'off' }
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  }
])
