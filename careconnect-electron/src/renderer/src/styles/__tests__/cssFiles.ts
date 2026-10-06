/**
 * Reads the renderer's stylesheets for the style tests. Jest maps `*.css`
 * imports to an empty stub, so the tests read the files from disk. The
 * renderer's tsconfig has no Node types, so the few fs/path calls used here
 * are typed locally.
 */
interface NodeFs {
  readFileSync(path: string, encoding: 'utf8'): string
  readdirSync(path: string, options: { recursive: true }): string[]
}

interface NodePath {
  join(...parts: string[]): string
}

declare const __dirname: string

const fs = jest.requireActual<NodeFs>('node:fs')
const path = jest.requireActual<NodePath>('node:path')

export const STYLES_DIR = path.join(__dirname, '..')
const RENDERER_SRC = path.join(STYLES_DIR, '..')

export function readStyle(name: string): string {
  return fs.readFileSync(path.join(STYLES_DIR, name), 'utf8')
}

/** Every file under src/renderer/src whose name passes `include`, as [path relative to it, text]. */
function rendererFiles(include: (file: string) => boolean): [string, string][] {
  return fs
    .readdirSync(RENDERER_SRC, { recursive: true })
    .map((file) => file.replace(/\\/g, '/'))
    .filter(include)
    .sort()
    .map((file) => [file, fs.readFileSync(path.join(RENDERER_SRC, file), 'utf8')])
}

/** Every stylesheet under src/renderer/src, as [path relative to it, text]. */
export function allRendererStylesheets(): [string, string][] {
  return rendererFiles((file) => file.endsWith('.css'))
}

/** Every component source file (.tsx) under src/renderer/src, tests excluded. */
export function rendererComponentSources(): [string, string][] {
  return rendererFiles((file) => file.endsWith('.tsx') && !file.includes('__tests__/'))
}

export function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

export interface CssRule {
  selector: string
  body: string
  /** Enclosing at-rules, outermost first. */
  within: string[]
}

/** A small parser for plain CSS: rules and the at-rules around them. */
export function cssRules(css: string): CssRule[] {
  const rules: CssRule[] = []
  const stack: string[] = []
  let buffer = ''
  for (const char of stripComments(css)) {
    if (char === '{') {
      stack.push(buffer.trim())
      buffer = ''
    } else if (char === '}') {
      const selector = stack.pop() ?? ''
      if (buffer.trim()) rules.push({ selector, body: buffer.trim(), within: [...stack] })
      buffer = ''
    } else {
      buffer += char
    }
  }
  return rules
}

/** Custom properties declared in a rule body: { '--color-text': '#0f172a' }. */
export function customProperties(body: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const match of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) result[match[1]] = match[2].trim()
  return result
}
