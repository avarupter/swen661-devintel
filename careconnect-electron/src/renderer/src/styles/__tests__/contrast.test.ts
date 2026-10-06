/**
 * Recomputes the WCAG 2.2 contrast ratio of every colour pair the design
 * relies on, from the values in tokens.css (spec cards 02 and 06), so a colour
 * change that breaks AA fails the suite.
 */
import { allRendererStylesheets, cssRules, readStyle, rendererComponentSources } from './cssFiles'

const TOKENS = readStyle('tokens.css')

/** WCAG 2.2 relative luminance of an sRGB colour (#rgb or #rrggbb). */
function relativeLuminance(hex: string): number {
  const digits = hex.replace('#', '')
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits
  expect(full).toMatch(/^[0-9a-f]{6}$/i)
  const [r, g, b] = [0, 2, 4].map((offset) => {
    const channel = parseInt(full.slice(offset, offset + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG 2.2 contrast ratio, from 1 (none) to 21 (black on white). */
function contrast(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

interface Declaration {
  name: string
  value: string
  comment: string
}

/** The custom properties of the block that starts with `selector {`, with any trailing comment. */
function block(selector: string): Declaration[] {
  const start = TOKENS.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`tokens.css has no "${selector}" block`)
  const text = TOKENS.slice(start, TOKENS.indexOf('\n}', start))
  return Array.from(text.matchAll(/^\s*(--[\w-]+):\s*([^;]+);[ \t]*(?:\/\*\s*(.*?)\s*\*\/)?/gm), (match) => ({
    name: match[1],
    value: match[2].trim(),
    comment: match[3] ?? ''
  }))
}

type Theme = Record<string, string>

const toTheme = (declarations: Declaration[]): Theme => Object.fromEntries(declarations.map(({ name, value }) => [name, value.toLowerCase()]))

const BASE: Theme = toTheme(block(':root'))
const HIGH_CONTRAST: Theme = { ...BASE, ...toTheme(block(":root[data-theme='high-contrast']")) }
const MORE_CONTRAST: Theme = { ...BASE, ...toTheme(block(":root:not([data-theme='high-contrast'])")) }

function color(theme: Theme, name: string): string {
  const value = theme[name]
  if (!value) throw new Error(`No token ${name}`)
  expect(value).toMatch(/^#[0-9a-f]{3}([0-9a-f]{3})?$/)
  return value
}

const WCAG = { text: 4.5, ui: 3, enhancedText: 7 }

describe('the WCAG formula', () => {
  it('matches the reference values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#ffffff', '#ffffff')).toBe(1)
    expect(contrast('#777', '#ffffff')).toBeCloseTo(4.48, 2)
    expect(contrast('#ffffff', '#767676')).toBeCloseTo(4.54, 2)
  })
})

describe('the ratios noted in tokens.css', () => {
  interface Claim {
    foreground: string
    background: string
    stated: number
    minimum: number
  }

  const claims: Claim[] = block(':root').flatMap(({ name, comment }) => {
    const minimum = name.includes('border') ? WCAG.ui : WCAG.text
    const found: Claim[] = Array.from(comment.matchAll(/(\d+(?:\.\d+)?):1 on ([a-z-]+)/g), (match) => ({
      foreground: name,
      background: `--color-${match[2]}`,
      stated: Number(match[1]),
      minimum
    }))
    const white = /white text (\d+(?:\.\d+)?):1/.exec(comment)
    if (white) found.push({ foreground: '--white', background: name, stated: Number(white[1]), minimum: WCAG.text })
    return found
  })

  it('finds every noted pair', () => {
    expect(claims.map(({ foreground, background }) => `${foreground} on ${background}`)).toEqual([
      '--color-text on --color-surface',
      '--color-text on --color-page',
      '--color-text-secondary on --color-surface',
      '--color-text-secondary on --color-selected',
      '--color-text-muted on --color-surface',
      '--color-text-muted on --color-surface-muted',
      '--color-text-inverse on --color-navy',
      '--color-link on --color-surface',
      '--color-link on --color-selected',
      '--white on --color-brand',
      '--white on --color-brand-strong',
      '--color-border-strong on --color-surface',
      '--color-review-text on --color-review-bg',
      '--color-review-body on --color-review-bg',
      '--color-open-text on --color-open-bg',
      '--color-done-text on --color-done-bg',
      '--color-error-text on --color-error-bg',
      '--color-error-text on --color-surface'
    ])
  })

  it.each(claims.map((claim) => [`${claim.foreground} on ${claim.background}`, claim] as const))('%s is as stated and passes AA', (_name, claim) => {
    const theme = { ...BASE, '--white': '#ffffff' }
    const ratio = contrast(color(theme, claim.foreground), color(theme, claim.background))
    expect(Math.abs(ratio - claim.stated)).toBeLessThanOrEqual(0.01)
    expect(ratio).toBeGreaterThanOrEqual(claim.minimum)
  })

  it('keeps the focus ring on its halo at 3.97:1 (spec card 02)', () => {
    expect(color(BASE, '--focus-halo')).toBe('#ffffff')
    const ratio = contrast(color(BASE, '--focus-ring'), color(BASE, '--focus-halo'))
    expect(ratio).toBeCloseTo(3.97, 2)
    expect(ratio).toBeGreaterThanOrEqual(WCAG.ui)
  })
})

describe('the design’s token table (design section 10)', () => {
  const ROWS: [token: string, hex: string, pairs: [background: string, ratio: number, minimum: number][]][] = [
    ['--color-text', '#0F172A', [['#FFFFFF', 17.85, WCAG.text], ['#F4F6F9', 16.49, WCAG.text]]],
    ['--color-text-secondary', '#475569', [['#FFFFFF', 7.58, WCAG.text], ['#E8F0FE', 6.61, WCAG.text]]],
    ['--color-text-muted', '#5A6B7F', [['#FFFFFF', 5.46, WCAG.text], ['#EEF2F6', 4.86, WCAG.text]]],
    ['--color-link', '#1559B8', [['#FFFFFF', 6.66, WCAG.text], ['#E8F0FE', 5.81, WCAG.text]]],
    ['--color-brand', '#1A73E8', [['#FFFFFF', 4.51, WCAG.text]]],
    ['--color-review-text', '#8A4B00', [['#FFF4E5', 6.26, WCAG.text]]],
    ['--color-done-text', '#1E6B34', [['#E6F4EA', 5.76, WCAG.text]]],
    ['--color-error-text', '#B3261E', [['#FDECEA', 5.72, WCAG.text]]],
    ['--focus-ring', '#008F89', [['#FFFFFF', 3.97, WCAG.ui]]],
    ['--color-border-strong', '#7A8899', [['#FFFFFF', 3.61, WCAG.ui]]]
  ]

  it.each(ROWS)('%s is %s, as measured in the design', (token, hex, pairs) => {
    expect(color(BASE, token)).toBe(hex.toLowerCase())
    for (const [background, ratio, minimum] of pairs) {
      const measured = contrast(hex, background)
      expect(Math.abs(measured - ratio)).toBeLessThanOrEqual(0.01)
      expect(measured).toBeGreaterThanOrEqual(minimum)
    }
  })

  it('uses the same backgrounds as the table', () => {
    expect([
      color(BASE, '--color-surface'),
      color(BASE, '--color-page'),
      color(BASE, '--color-selected'),
      color(BASE, '--color-surface-muted'),
      color(BASE, '--color-review-bg'),
      color(BASE, '--color-done-bg'),
      color(BASE, '--color-error-bg')
    ]).toEqual(['#ffffff', '#f4f6f9', '#e8f0fe', '#eef2f6', '#fff4e5', '#e6f4ea', '#fdecea'])
  })
})

describe('the focus ring where it has no white halo (spec card 02)', () => {
  /** The classes of rows marked `focus-inset`, which draw the ring inside their own edge, on their own background. */
  function focusInsetRowClasses(): string[] {
    const classes = new Set<string>()
    for (const [, source] of rendererComponentSources()) {
      for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
        const value = match[1] ?? match[2]
        if (!/\bfocus-inset\b/.test(value)) continue
        const row = value
          .replace(/\$\{[^}]*\}/g, ' ')
          .split(/\s+/)
          .find((name) => name !== '' && name !== 'focus-inset')
        if (row) classes.add(row)
      }
    }
    return [...classes].sort()
  }

  /** Background tokens of the rules that style the row itself: `.row`, `.row:hover`, `.row--selected`, `.row[aria-selected='true']`. */
  function rowBackgrounds(row: string): string[] {
    const ownCompound = new RegExp(`^\\.${row}(?:--[\\w-]+)?(?=$|[:.[])`)
    return allRendererStylesheets()
      .flatMap(([, css]) => cssRules(css))
      .filter((rule) => rule.selector.split(',').some((selector) => ownCompound.test(selector.trim().split(/[\s>+~]+/).pop() ?? '')))
      .flatMap((rule) => Array.from(rule.body.matchAll(/background(?:-color)?:\s*var\((--[\w-]+)\)/g), (match) => match[1]))
  }

  const ROWS = focusInsetRowClasses()
  // A transparent row shows the pane behind it, which is the surface or the page colour.
  const BEHIND_TRANSPARENT_ROWS = ['--color-surface', '--color-page']
  const backgrounds = (row: string): string[] => [...new Set([...rowBackgrounds(row), ...BEHIND_TRANSPARENT_ROWS])]

  it('finds the focus-inset rows and the backgrounds they are drawn on', () => {
    expect(ROWS).toContain('patient-option')
    expect(ROWS.flatMap(rowBackgrounds)).toEqual(expect.arrayContaining(['--color-selected', '--color-surface-muted']))
  })

  it.each(ROWS)('keeps the ring at 3:1 or more on every background of .%s, in both themes', (row) => {
    const themes: [string, Theme][] = [
      ['default', BASE],
      ['high contrast', HIGH_CONTRAST]
    ]
    const failing = themes.flatMap(([name, theme]) =>
      backgrounds(row)
        .filter((background) => contrast(color(theme, '--focus-ring'), color(theme, background)) < WCAG.ui)
        .map((background) => `${name}: ${background}`)
    )
    expect(failing).toEqual([])
  })

  it('measures the ring on the row and pane colours: below the halo’s 3.97:1, but above 3:1', () => {
    const ring = color(BASE, '--focus-ring')
    expect(contrast(ring, color(BASE, '--color-selected'))).toBeCloseTo(3.46, 2)
    expect(contrast(ring, color(BASE, '--color-surface-muted'))).toBeCloseTo(3.53, 2)
    expect(contrast(ring, color(BASE, '--color-page'))).toBeCloseTo(3.67, 2)
  })

  it('would fail on the dimmed dialog backdrop, which is why a focused dialog draws its ring inside its own edge', () => {
    const match = /^rgb\((\d+) (\d+) (\d+) \/ (0?\.\d+)\)$/.exec(BASE['--color-backdrop'] ?? '')
    expect(match).not.toBeNull()
    const [red, green, blue, alpha] = (match as RegExpExecArray).slice(1).map(Number)
    const over = (hex: string): string => {
      const below = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16))
      const blended = [red, green, blue].map((channel, index) => Math.round(alpha * channel + (1 - alpha) * below[index]))
      return `#${blended.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
    }
    for (const surface of ['--color-page', '--color-surface']) {
      expect(contrast(color(BASE, '--focus-ring'), over(color(BASE, surface)))).toBeLessThan(WCAG.ui)
    }
    // Inside the dialog the ring sits on the dialog surface, or on the footer's page colour.
    expect(contrast(color(BASE, '--focus-ring'), color(BASE, '--color-surface'))).toBeGreaterThanOrEqual(WCAG.ui)
    expect(contrast(color(BASE, '--focus-ring'), color(BASE, '--color-page'))).toBeGreaterThanOrEqual(WCAG.ui)
  })
})

describe('deviation 2: the focus ring colour', () => {
  it('replaces the design’s #00A9A2, which fails 3:1 on white and on the selected row', () => {
    expect(contrast('#00A9A2', '#FFFFFF')).toBeCloseTo(2.92, 2)
    expect(contrast('#00A9A2', '#FFFFFF')).toBeLessThan(WCAG.ui)
    expect(contrast('#00A9A2', color(BASE, '--color-selected'))).toBeLessThan(WCAG.ui)
    expect(color(BASE, '--focus-ring')).not.toBe('#00a9a2')
  })
})

describe('the in-app high contrast theme', () => {
  const TEXT_TOKENS = [
    '--color-text',
    '--color-text-secondary',
    '--color-text-muted',
    '--color-link',
    '--color-review-text',
    '--color-review-body',
    '--color-open-text',
    '--color-done-text',
    '--color-error-text'
  ]

  it.each(TEXT_TOKENS)('%s reaches 7:1 (AAA) on white', (token) => {
    expect(contrast(color(HIGH_CONTRAST, token), '#ffffff')).toBeGreaterThanOrEqual(WCAG.enhancedText)
  })

  it.each(['--color-text', '--color-text-secondary', '--color-text-muted', '--color-link'])('%s reaches 7:1 on every surface', (token) => {
    for (const surface of ['--color-page', '--color-surface', '--color-surface-muted', '--color-selected']) {
      expect(contrast(color(HIGH_CONTRAST, token), color(HIGH_CONTRAST, surface))).toBeGreaterThanOrEqual(WCAG.enhancedText)
    }
  })

  it.each([
    ['--color-review-text', '--color-review-bg'],
    ['--color-review-body', '--color-review-bg'],
    ['--color-open-text', '--color-open-bg'],
    ['--color-done-text', '--color-done-bg'],
    ['--color-error-text', '--color-error-bg']
  ])('%s reaches 7:1 on %s', (text, background) => {
    expect(contrast(color(HIGH_CONTRAST, text), color(HIGH_CONTRAST, background))).toBeGreaterThanOrEqual(WCAG.enhancedText)
  })

  it('keeps white button text, borders and the focus ring well above the minimums', () => {
    expect(contrast('#ffffff', color(HIGH_CONTRAST, '--color-brand'))).toBeGreaterThanOrEqual(WCAG.enhancedText)
    expect(contrast('#ffffff', color(HIGH_CONTRAST, '--color-brand-strong'))).toBeGreaterThanOrEqual(WCAG.enhancedText)
    for (const border of ['--color-border', '--color-border-strong', '--color-border-control']) {
      expect(contrast(color(HIGH_CONTRAST, border), color(HIGH_CONTRAST, '--color-surface'))).toBeGreaterThanOrEqual(WCAG.ui)
    }
    expect(contrast(color(HIGH_CONTRAST, '--focus-ring'), color(HIGH_CONTRAST, '--focus-halo'))).toBeGreaterThanOrEqual(WCAG.ui)
  })
})

describe('the "more contrast" system preference (macOS Increase Contrast)', () => {
  it.each(['--color-text-secondary', '--color-text-muted'])('raises %s to 7:1 on every surface', (token) => {
    expect(color(MORE_CONTRAST, token)).not.toBe(color(BASE, token))
    for (const surface of ['--color-page', '--color-surface', '--color-surface-muted', '--color-selected']) {
      expect(contrast(color(MORE_CONTRAST, token), color(MORE_CONTRAST, surface))).toBeGreaterThanOrEqual(WCAG.enhancedText)
    }
  })

  it('gives labelled controls a 3:1 boundary', () => {
    expect(contrast(color(MORE_CONTRAST, '--color-border-control'), color(MORE_CONTRAST, '--color-surface'))).toBeGreaterThanOrEqual(WCAG.ui)
  })
})
