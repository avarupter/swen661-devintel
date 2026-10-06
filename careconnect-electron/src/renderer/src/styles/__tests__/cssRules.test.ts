/**
 * The plan's global styling rules, checked across every renderer stylesheet:
 * colours come from tokens.css, focus is the only thing drawn with `outline`
 * (spec card 02), and forced-colours and motion preferences are honoured
 * (design section 9).
 */
import { allRendererStylesheets, cssRules, customProperties, readStyle, stripComments, type CssRule } from './cssFiles'

const SHEETS = allRendererStylesheets()
const TOKEN_NAMES = new Set(cssRules(readStyle('tokens.css')).flatMap((rule) => Object.keys(customProperties(rule.body))))

describe('renderer stylesheets', () => {
  it('include the foundation sheets', () => {
    expect(SHEETS.map(([file]) => file)).toEqual(expect.arrayContaining(['styles/tokens.css', 'styles/base.css', 'styles/layout.css']))
  })

  it.each(SHEETS.filter(([file]) => file !== 'styles/tokens.css'))('%s uses colour tokens, never raw hex', (_file, css) => {
    expect(stripComments(css).match(/#[0-9a-f]{3,8}\b/gi) ?? []).toEqual([])
  })

  it.each(SHEETS)('%s only refers to custom properties that exist', (_file, css) => {
    const local = new Set(cssRules(css).flatMap((rule) => Object.keys(customProperties(rule.body))))
    const missing = Array.from(stripComments(css).matchAll(/var\((--[\w-]+)/g), (match) => match[1]).filter(
      (name) => !TOKEN_NAMES.has(name) && !local.has(name)
    )
    expect(missing).toEqual([])
  })

  it.each(SHEETS)('%s draws outlines only for focus, never for selection or validation', (_file, css) => {
    const misuse = cssRules(css)
      .filter((rule) => /(^|;|\s)outline(-offset)?\s*:/.test(rule.body))
      .filter((rule) => !rule.selector.split(',').every((selector) => selector.includes(':focus')))
      .map((rule) => rule.selector)
    expect(misuse).toEqual([])
  })

  it.each(SHEETS)('%s removes the focus outline only where :focus-visible does not apply', (_file, css) => {
    const removesOutline = /(^|;|\s)(outline(-style)?\s*:\s*(none|0)\b|outline-width\s*:\s*0\b|outline-color\s*:\s*transparent\b)/
    const hidesFocus = cssRules(css)
      .filter((rule) => removesOutline.test(rule.body))
      .filter((rule) => !rule.selector.split(',').every((selector) => selector.includes(':not(:focus-visible)')))
      .map((rule) => rule.selector)
    expect(hidesFocus).toEqual([])
  })

  it.each(SHEETS.filter(([file]) => file !== 'styles/base.css'))('%s leaves the focus outline itself to base.css, so forced colours can replace it', (_file, css) => {
    const setsOutline = cssRules(css)
      .filter((rule) => /(^|;|\s)outline(-color|-style|-width)?\s*:/.test(rule.body))
      .map((rule) => rule.selector)
    expect(setsOutline).toEqual([])
  })
})

describe('base.css', () => {
  const rules = cssRules(readStyle('base.css'))

  const indexOf = (selector: string, within: string[] = []): number =>
    rules.findIndex((rule) => rule.selector === selector && rule.within.join('|') === within.join('|'))
  const ruleFor = (selector: string, within: string[] = []): CssRule | undefined => rules[indexOf(selector, within)]

  it('draws the focus ring with :focus-visible, using the focus tokens', () => {
    expect(ruleFor(':focus-visible')?.body).toMatch(/outline:\s*var\(--focus-outline\)/)
    expect(ruleFor(':root :focus-visible')?.body).toMatch(/box-shadow:\s*var\(--focus-shadow\)/)
  })

  it('gives the white halo a rule more specific than a component’s own box-shadow (.card, .dialog, a view’s .stat-card)', () => {
    // :root :focus-visible (0,2,0) beats a single class (0,1,0) whichever sheet loads later.
    const halo = ruleFor(':root :focus-visible')
    expect(halo?.body).not.toMatch(/outline/)
    for (const component of ['.card', '.dialog']) {
      expect(ruleFor(component)?.body).toMatch(/box-shadow:/)
    }
  })

  it('keeps the outline at :focus-visible specificity, so the later forced-colours rule replaces it', () => {
    const forced = ['@media (forced-colors: active)']
    expect(ruleFor(':focus-visible', forced)?.body).toMatch(/outline:\s*3px solid Highlight/)
    expect(indexOf(':focus-visible', forced)).toBeGreaterThan(indexOf(':focus-visible'))
    const outlineRules = rules.filter((rule) => /(^|;|\s)outline(-color|-style|-width)?\s*:/.test(rule.body) && !rule.selector.includes(':not(:focus-visible)'))
    expect(outlineRules.map((rule) => rule.selector)).toEqual([':focus-visible', ':focus-visible'])
  })

  it('draws the ring inside rows in scroll containers, with no halo to clip (.focus-inset)', () => {
    const inset = ruleFor('.focus-inset:focus-visible')
    expect(inset?.body).toMatch(/outline-offset:\s*-3px/)
    expect(inset?.body).toMatch(/box-shadow:\s*none/)
    expect(indexOf('.focus-inset:focus-visible')).toBeGreaterThan(indexOf(':root :focus-visible'))
  })

  it('draws the ring inside a focused dialog, on its white edge, not on the dimmed backdrop', () => {
    const dialog = ruleFor('.dialog:focus-visible')
    expect(dialog?.body).toMatch(/outline-offset:\s*-5px/)
    expect(dialog?.body).toMatch(/box-shadow:\s*var\(--shadow-dialog\)/)
    expect(indexOf('.dialog:focus-visible')).toBeGreaterThan(indexOf(':root :focus-visible'))
  })

  it('honours reduced motion from the system and from the in-app setting', () => {
    expect(rules.some((rule) => rule.within.includes('@media (prefers-reduced-motion: reduce)') && /transition-duration/.test(rule.body))).toBe(true)
    expect(rules.some((rule) => rule.selector.includes("[data-motion='reduce']") && /transition-duration/.test(rule.body))).toBe(true)
  })

  it('marks invalid fields with a border, never the outline', () => {
    const invalid = rules.find((rule) => rule.selector.includes(".input[aria-invalid='true']") && rule.within.length === 0)
    expect(invalid?.body).toMatch(/border:\s*2px solid var\(--color-error-text\)/)
  })
})

describe('tokens.css', () => {
  it('defines the in-app high contrast theme and the "more contrast" preference', () => {
    const rules = cssRules(readStyle('tokens.css'))
    expect(rules.some((rule) => rule.selector === ":root[data-theme='high-contrast']")).toBe(true)
    expect(rules.some((rule) => rule.within.includes('@media (prefers-contrast: more)'))).toBe(true)
  })

  it('sets the essential and minimum target sizes from spec card 06', () => {
    const root = cssRules(readStyle('tokens.css')).find((rule) => rule.selector === ':root')
    expect(customProperties(root?.body ?? '')).toMatchObject({ '--target-min': '32px', '--target-essential': '44px' })
  })
})
