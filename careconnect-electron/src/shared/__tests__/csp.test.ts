import { DEV_SERVER_CSP, META_PRODUCTION_CSP, PRODUCTION_CSP } from '../csp'

/** "default-src 'none'; script-src 'self'" → { 'default-src': ["'none'"], 'script-src': ["'self'"] } */
function directives(policy: string): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const part of policy.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/)
    expect(result[name]).toBeUndefined()
    result[name] = sources
  }
  return result
}

describe('Content-Security-Policy', () => {
  it.each([
    ['production', PRODUCTION_CSP],
    ['production <meta>', META_PRODUCTION_CSP],
    ['dev server', DEV_SERVER_CSP]
  ])('the %s policy never allows unsafe-eval or plugins', (_name, policy) => {
    expect(policy).not.toContain('unsafe-eval')
    expect(directives(policy)['object-src']).toEqual(["'none'"])
    expect(directives(policy)['base-uri']).toEqual(["'none'"])
    expect(directives(policy)['form-action']).toEqual(["'none'"])
  })

  it('production allows no inline code, no remote origins and nothing by default', () => {
    expect(PRODUCTION_CSP).not.toContain('unsafe-inline')
    expect(directives(PRODUCTION_CSP)).toEqual({
      'default-src': ["'none'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'img-src': ["'self'", 'data:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'base-uri': ["'none'"],
      'form-action': ["'none'"],
      'object-src': ["'none'"],
      'frame-ancestors': ["'none'"]
    })
  })

  it('the <meta> copy differs only by frame-ancestors, which browsers ignore in <meta>', () => {
    const { 'frame-ancestors': frameAncestors, ...rest } = directives(PRODUCTION_CSP)
    expect(frameAncestors).toEqual(["'none'"])
    expect(directives(META_PRODUCTION_CSP)).toEqual(rest)
    expect(META_PRODUCTION_CSP).not.toContain('unsafe-inline')
  })

  it('the dev-server policy relaxes only what Vite needs: inline React Refresh and the local HMR socket', () => {
    const dev = directives(DEV_SERVER_CSP)
    expect(dev['script-src']).toEqual(["'self'", "'unsafe-inline'"])
    expect(dev['connect-src']).toEqual(["'self'", 'ws://localhost:*'])
    for (const sources of Object.values(dev)) {
      for (const source of sources) expect(source).toMatch(/^('[a-z-]+'|data:|ws:\/\/localhost:\*)$/)
    }
  })
})
