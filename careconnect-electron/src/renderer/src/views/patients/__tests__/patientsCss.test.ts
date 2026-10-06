/**
 * Layout rules jsdom cannot render, checked in the stylesheet itself. They were
 * measured in Electron from 640 to 1920 px wide:
 *  - Care summary and Recent activity sit side by side only while the detail
 *    pane has 600 px of content width, so the summary is never the narrower
 *    column and never overflows its card (it was 146 px wide at 1101 px).
 *  - The meta line wraps between its parts, never inside "Care ID CC-1048".
 */
import { allRendererStylesheets, cssRules, type CssRule } from '../../../styles/__tests__/cssFiles'

const SOURCE = allRendererStylesheets().find(([file]) => file === 'views/patients/patients.css')?.[1] ?? ''
const RULES = cssRules(SOURCE)

/** { 'grid-template-columns': 'minmax(0, 1fr)' } for a rule body. */
function declarations(rule: CssRule | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  for (const match of (rule?.body ?? '').matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) result[match[1]] = match[2].trim()
  return result
}

function rulesFor(selector: string): CssRule[] {
  return RULES.filter((rule) => rule.selector === selector)
}

describe('patients.css layout', () => {
  it('is found on disk', () => {
    expect(SOURCE).toContain('.patient-detail')
  })

  it('makes the detail pane an inline-size container named "patient-detail"', () => {
    const pane = rulesFor('.patient-detail').find((rule) => rule.within.length === 0)
    expect(declarations(pane).container).toBe('patient-detail / inline-size')
  })

  it('splits care summary and Recent activity 1.7 : 1, keeping Recent activity at least 280 px', () => {
    const base = rulesFor('.patient-detail__columns').find((rule) => rule.within.length === 0)
    expect(declarations(base)['grid-template-columns']).toBe('minmax(0, 1.7fr) minmax(280px, 1fr)')
  })

  it('stacks them only when the pane, not the window, is under 600 px wide', () => {
    const overrides = rulesFor('.patient-detail__columns').filter((rule) => rule.within.length > 0)
    expect(overrides.map((rule) => ({ within: rule.within, columns: declarations(rule)['grid-template-columns'] }))).toEqual([
      { within: ['@container patient-detail (width < 600px)'], columns: 'minmax(0, 1fr)' }
    ])
  })

  it('keeps each part of the meta line together, while letting an over-long part wrap inside its own box', () => {
    const part = rulesFor('.patient-detail__meta-part')
    expect(part).toHaveLength(1)
    expect(declarations(part[0])).toEqual({ display: 'inline-block', 'max-width': '100%', 'overflow-wrap': 'anywhere' })
  })
})
