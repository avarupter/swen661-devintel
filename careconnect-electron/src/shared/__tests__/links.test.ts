import { ALLOWED_EXTERNAL_HOSTS, isAllowedExternalUrl, RESOURCE_LINKS } from '../links'

describe('isAllowedExternalUrl', () => {
  it.each([
    'https://www.w3.org/WAI/WCAG22/quickref/',
    'https://www.nvaccess.org/files/nvda/documentation/userGuide.html',
    'https://support.microsoft.com/windows/complete-guide-to-narrator-e4397a0d-ef4f-b386-d8ae-c172f109bdb1',
    'https://learn.microsoft.com/',
    'https://www.electronjs.org/docs/latest/tutorial/accessibility',
    'https://medlineplus.gov/healthtopics.html?query=x#top',
    // The URL parser lower-cases hosts and drops the default port, so these are the same links.
    'https://WWW.W3.ORG/WAI/',
    'https://www.w3.org:443/'
  ])('allows %s', (url) => {
    expect(isAllowedExternalUrl(url)).toBe(true)
  })

  it.each([
    ['plain http', 'http://www.w3.org/WAI/'],
    ['a userinfo trick that really points at another host', 'https://www.w3.org@evil.example/'],
    ['a username', 'https://user@www.w3.org/'],
    ['a username and password', 'https://user:secret@www.w3.org/'],
    ['a non-default port', 'https://www.w3.org:8443/'],
    ['an unknown host', 'https://evil.example/'],
    ['a look-alike subdomain', 'https://www.w3.org.evil.example/'],
    ['a parent domain that is not listed', 'https://w3.org/'],
    ['a homograph host', 'https://www.w3.οrg/'],
    ['backslashes that hide another host', 'https:\\\\evil.example\\www.w3.org'],
    ['a javascript: URL', 'javascript:alert(document.domain)'],
    ['a data: URL', 'data:text/html,<script>alert(1)</script>'],
    ['a file: URL', 'file:///C:/Windows/System32/calc.exe'],
    ['the app’s own protocol', 'app://careconnect/index.html'],
    ['a protocol-relative URL', '//www.w3.org/'],
    ['text that is not a URL', 'www.w3.org'],
    ['an empty string', '']
  ])('rejects %s', (_name, url) => {
    expect(isAllowedExternalUrl(url)).toBe(false)
  })
})

describe('RESOURCE_LINKS', () => {
  it('has unique ids and only allow-listed URLs', () => {
    expect(new Set(RESOURCE_LINKS.map((link) => link.id)).size).toBe(RESOURCE_LINKS.length)
    for (const link of RESOURCE_LINKS) {
      expect(isAllowedExternalUrl(link.url)).toBe(true)
      expect(link.title).not.toBe('')
      expect(link.description).not.toBe('')
    }
  })

  it('groups links into the three categories, with the accessibility guides the Help dialog lists', () => {
    expect(new Set(RESOURCE_LINKS.map((link) => link.category))).toEqual(new Set(['Accessibility', 'Clinical reference', 'Product']))
    expect(RESOURCE_LINKS.filter((link) => link.category === 'Accessibility').map((link) => link.id)).toEqual([
      'wcag-quickref',
      'nvda-guide',
      'narrator-guide',
      'contrast-themes'
    ])
  })

  it('lists only lower-case host names, which is how the URL parser reports them', () => {
    for (const host of ALLOWED_EXTERNAL_HOSTS) expect(host).toBe(host.toLowerCase())
  })
})
