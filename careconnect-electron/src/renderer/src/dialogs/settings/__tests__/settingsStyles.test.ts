/**
 * The settings switches are interactive targets, so they stay at least
 * 32×32 px (spec card 06), including in Windows High Contrast, where the
 * drawn track gives way to the native checkbox. Jest maps CSS imports to a
 * stub, so the stylesheets are read from disk. The renderer's tsconfig has no
 * Node types, so the two fs/path calls are typed locally.
 */
interface NodeFs {
  readFileSync(path: string, encoding: 'utf8'): string
}

interface NodePath {
  join(...parts: string[]): string
}

declare const __dirname: string

const fs = jest.requireActual<NodeFs>('node:fs')
const path = jest.requireActual<NodePath>('node:path')

const read = (...parts: string[]): string => fs.readFileSync(path.join(__dirname, ...parts), 'utf8')
const SETTINGS_CSS = read('..', 'settings.css')
const TOKENS_CSS = read('..', '..', '..', 'styles', 'tokens.css')

interface Rule {
  selector: string
  /** The enclosing at-rule, or null at the top level. */
  media: string | null
  declarations: Record<string, string>
}

/** Plain CSS (no nesting beyond one at-rule) as a list of rules. */
function parse(css: string): Rule[] {
  const rules: Rule[] = []
  const stack: string[] = []
  let buffer = ''
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') {
      stack.push(buffer.trim())
      buffer = ''
    } else if (char === '}') {
      const selector = stack.pop() ?? ''
      if (buffer.trim()) {
        const declarations: Record<string, string> = {}
        for (const match of buffer.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)) declarations[match[1]] = match[2].trim()
        rules.push({ selector, media: stack[stack.length - 1] ?? null, declarations })
      }
      buffer = ''
    } else {
      buffer += char
    }
  }
  return rules
}

const TOKENS = parse(TOKENS_CSS).find((rule) => rule.selector === ':root' && rule.media === null)?.declarations ?? {}

/** A length in px, resolving one var(--token) from tokens.css. */
function px(value: string | undefined): number {
  const token = /^var\((--[\w-]+)\)$/.exec(value ?? '')?.[1]
  const resolved = token ? TOKENS[token] : value
  const match = /^(\d+(?:\.\d+)?)px$/.exec(resolved ?? '')
  if (!match) throw new Error(`Expected a px length, got ${String(value)}`)
  return Number(match[1])
}

function switchRule(media: string | null): Record<string, string> {
  const rule = parse(SETTINGS_CSS).find((entry) => entry.selector === '.settings__switch' && entry.media === media)
  expect(rule).toBeDefined()
  return rule?.declarations ?? {}
}

describe('settings.css', () => {
  it('draws each switch at least 32×32 px', () => {
    const drawn = switchRule(null)
    expect(px(drawn.width)).toBeGreaterThanOrEqual(32)
    expect(px(drawn.height)).toBeGreaterThanOrEqual(32)
  })

  it('keeps the native checkbox that replaces it in forced colours at least 32×32 px', () => {
    const forced = switchRule('@media (forced-colors: active)')
    expect(forced.appearance).toBe('auto')
    expect(px(forced.width)).toBeGreaterThanOrEqual(32)
    expect(px(forced.height)).toBeGreaterThanOrEqual(32)
  })
})
