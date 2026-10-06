import { focusableWithin, moveToRegion, regionOf, regionsIn, rememberFocus, type RegionMemory } from '../regions'

/** The Patients view's regions, in the design's F6 order. */
function buildPatientsWorkspace(): void {
  document.body.innerHTML = `
    <div class="skip-links"><a href="#main">Skip to main workspace</a></div>
    <nav data-region="navigation" aria-label="Workspace">
      <button type="button">Overview</button>
      <button type="button">Patients</button>
    </nav>
    <header>
      <h1 id="view-title" tabindex="-1">Patients</h1>
      <div role="toolbar" aria-label="Patients tools" data-region="toolbar">
        <button type="button" tabindex="0">Search</button>
        <button type="button" tabindex="-1">Filter</button>
      </div>
    </header>
    <main id="main" tabindex="-1">
      <section id="patient-list" data-region="list" aria-label="Recent patients">
        <input id="patient-search" type="search" aria-label="Search list">
        <ul role="listbox" aria-label="Recent patients">
          <li role="option" id="patient-option-p-avery-park" tabindex="0" aria-selected="true">Avery Park</li>
          <li role="option" id="patient-option-p-morgan-chen" tabindex="-1" aria-selected="false">Morgan Chen</li>
        </ul>
      </section>
      <section data-region="detail" aria-labelledby="patient-name-heading">
        <h2 id="patient-name-heading" tabindex="-1">Avery Park</h2>
        <button type="button">Message Avery Park</button>
      </section>
    </main>
    <footer id="status-bar" data-region="status" aria-label="Status" tabindex="-1">
      <button type="button">Keyboard help</button>
    </footer>
  `
}

const byText = (text: string): HTMLElement => {
  const element = Array.from(document.querySelectorAll<HTMLElement>('button, li, a, input, h1, h2')).find(
    (candidate) => candidate.textContent?.trim() === text || candidate.getAttribute('aria-label') === text
  )
  if (!element) throw new Error(`No element "${text}"`)
  return element
}

const activeRegion = (): string | undefined => regionOf(document.activeElement)?.dataset.region

afterEach(() => {
  document.body.innerHTML = ''
})

describe('regionsIn and regionOf', () => {
  it('lists regions in DOM order', () => {
    buildPatientsWorkspace()
    expect(regionsIn().map((region) => region.dataset.region)).toEqual(['navigation', 'toolbar', 'list', 'detail', 'status'])
  })

  it('skips regions that are hidden or inside an inert subtree', () => {
    buildPatientsWorkspace()
    document.querySelector('[data-region="detail"]')?.setAttribute('hidden', '')
    document.querySelector('header')?.setAttribute('inert', '')
    expect(regionsIn().map((region) => region.dataset.region)).toEqual(['navigation', 'list', 'status'])
  })

  it('finds the region around an element', () => {
    buildPatientsWorkspace()
    expect(regionOf(byText('Morgan Chen'))?.dataset.region).toBe('list')
    expect(regionOf(byText('Skip to main workspace'))).toBeNull()
    expect(regionOf(null)).toBeNull()
  })

  it('can search within a root', () => {
    buildPatientsWorkspace()
    const main = document.getElementById('main') as HTMLElement
    expect(regionsIn(main).map((region) => region.dataset.region)).toEqual(['list', 'detail'])
  })
})

describe('focusableWithin', () => {
  it('finds links, enabled controls and positive tab stops, but not disabled, hidden or programmatic-only targets', () => {
    document.body.innerHTML = `
      <div id="root">
        <a href="#x">Link</a>
        <a>Anchor without href</a>
        <button type="button">Button</button>
        <button type="button" disabled>Disabled</button>
        <input type="text" aria-label="Text">
        <input type="hidden" name="secret">
        <input type="text" aria-label="Disabled text" disabled>
        <select aria-label="Choice"><option>One</option></select>
        <textarea aria-label="Note"></textarea>
        <div tabindex="0">Custom stop</div>
        <div tabindex="-1">Programmatic only</div>
        <div hidden><button type="button">In hidden</button></div>
        <div inert><button type="button">In inert</button></div>
      </div>
    `
    const labels = focusableWithin(document.getElementById('root') as HTMLElement).map(
      (element) => element.getAttribute('aria-label') ?? element.textContent?.trim()
    )
    expect(labels).toEqual(['Link', 'Button', 'Text', 'Choice', 'Note', 'Custom stop'])
  })
})

describe('moveToRegion (F6 / Shift+F6)', () => {
  it('F6 cycles Navigation → Toolbar → Patient list → Detail → Status → Navigation', () => {
    buildPatientsWorkspace()
    const memory: RegionMemory = new Map()
    const visited = Array.from({ length: 6 }, () => {
      const name = moveToRegion(1, memory)
      expect(activeRegion()).toBe(name)
      return name
    })
    expect(visited).toEqual(['navigation', 'toolbar', 'list', 'detail', 'status', 'navigation'])
  })

  it('focuses the first control of a region it has not visited', () => {
    buildPatientsWorkspace()
    const memory: RegionMemory = new Map()
    const focused = Array.from({ length: 5 }, () => {
      moveToRegion(1, memory)
      return document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim()
    })
    expect(focused).toEqual(['Overview', 'Search', 'Search list', 'Message Avery Park', 'Keyboard help'])
  })

  it('Shift+F6 goes backwards, starting from the last region', () => {
    buildPatientsWorkspace()
    const memory: RegionMemory = new Map()
    const visited = Array.from({ length: 6 }, () => moveToRegion(-1, memory))
    expect(visited).toEqual(['status', 'detail', 'list', 'toolbar', 'navigation', 'status'])
  })

  it('continues from the region that has focus', () => {
    buildPatientsWorkspace()
    byText('Morgan Chen').focus()
    expect(moveToRegion(1, new Map())).toBe('detail')
    byText('Morgan Chen').focus()
    expect(moveToRegion(-1, new Map())).toBe('toolbar')
  })

  describe('from focus outside every region, it goes by document order', () => {
    it('from the view title (where navigation leaves focus), F6 goes on to the toolbar and Shift+F6 back to Navigation', () => {
      buildPatientsWorkspace()
      const title = document.getElementById('view-title') as HTMLElement
      title.focus()
      expect(regionOf(title)).toBeNull()
      expect(moveToRegion(1, new Map())).toBe('toolbar')
      expect(document.activeElement).toBe(byText('Search'))

      title.focus()
      expect(moveToRegion(-1, new Map())).toBe('navigation')
      expect(document.activeElement).toBe(byText('Overview'))
    })

    it('keeps the design order when F6 is pressed repeatedly from the view title', () => {
      buildPatientsWorkspace()
      document.getElementById('view-title')?.focus()
      const memory: RegionMemory = new Map()
      expect(Array.from({ length: 6 }, () => moveToRegion(1, memory))).toEqual(['toolbar', 'list', 'detail', 'status', 'navigation', 'toolbar'])
    })

    it('from #main ("Skip to main workspace"), F6 enters the first region inside it and Shift+F6 goes back to the toolbar', () => {
      buildPatientsWorkspace()
      const main = document.getElementById('main') as HTMLElement
      main.focus()
      expect(moveToRegion(1, new Map())).toBe('list')
      expect(document.activeElement).toBe(byText('Search list'))

      main.focus()
      expect(moveToRegion(-1, new Map())).toBe('toolbar')
    })

    it('from a skip link, before every region, F6 goes to Navigation and Shift+F6 wraps round to Status', () => {
      buildPatientsWorkspace()
      byText('Skip to main workspace').focus()
      expect(moveToRegion(1, new Map())).toBe('navigation')
      byText('Skip to main workspace').focus()
      expect(moveToRegion(-1, new Map())).toBe('status')
    })

    it('from after every region, F6 wraps round to Navigation and Shift+F6 goes to Status', () => {
      buildPatientsWorkspace()
      const after = document.createElement('button')
      after.textContent = 'After the status bar'
      document.body.append(after)
      after.focus()
      expect(moveToRegion(1, new Map())).toBe('navigation')
      after.focus()
      expect(moveToRegion(-1, new Map())).toBe('status')
    })

    it('treats a region that is hidden from F6 like the space around it', () => {
      buildPatientsWorkspace()
      const detail = document.querySelector<HTMLElement>('[data-region="detail"]') as HTMLElement
      detail.setAttribute('hidden', '')
      const message = byText('Message Avery Park')
      message.focus()
      expect(moveToRegion(1, new Map())).toBe('status')
      message.focus()
      expect(moveToRegion(-1, new Map())).toBe('list')
    })

    it('starts at either end when no element has focus at all', () => {
      buildPatientsWorkspace()
      const activeElement = jest.spyOn(document, 'activeElement', 'get').mockReturnValue(null)
      expect(moveToRegion(1, new Map())).toBe('navigation')
      expect(moveToRegion(-1, new Map())).toBe('status')
      activeElement.mockRestore()
    })
  })

  it('returns to the element last focused in a region', () => {
    buildPatientsWorkspace()
    const memory: RegionMemory = new Map()
    const morgan = byText('Morgan Chen')
    morgan.focus()
    rememberFocus(memory, morgan)
    byText('Patients').focus()
    rememberFocus(memory, document.activeElement)
    expect(memory.get('list')).toBe(morgan)
    expect(memory.get('navigation')).toBe(byText('Patients'))

    moveToRegion(1, memory)
    moveToRegion(1, memory)
    expect(document.activeElement).toBe(morgan)
    moveToRegion(-1, memory)
    moveToRegion(-1, memory)
    expect(document.activeElement).toBe(byText('Patients'))
  })

  it('falls back to the first control when the remembered one is gone or hidden', () => {
    buildPatientsWorkspace()
    const memory: RegionMemory = new Map()
    const morgan = byText('Morgan Chen')
    rememberFocus(memory, morgan)
    morgan.remove()
    byText('Search').focus()
    moveToRegion(1, memory)
    expect(document.activeElement).toBe(byText('Search list'))

    const message = byText('Message Avery Park')
    const help = byText('Keyboard help')
    rememberFocus(memory, help)
    help.setAttribute('hidden', '')
    message.focus()
    moveToRegion(1, memory)
    expect(document.activeElement).toBe(document.getElementById('status-bar'))
  })

  it('ignores a remembered element that has moved to another region', () => {
    buildPatientsWorkspace()
    const memory: RegionMemory = new Map()
    const help = byText('Keyboard help')
    rememberFocus(memory, help)
    document.querySelector('[data-region="navigation"]')?.append(help)
    byText('Message Avery Park').focus()
    moveToRegion(1, memory)
    expect(document.activeElement).toBe(document.getElementById('status-bar'))
  })

  it('gives an empty region tabindex=-1 and focus, so its landmark is announced', () => {
    document.body.innerHTML = `
      <nav data-region="navigation" aria-label="Workspace"><button type="button">Overview</button></nav>
      <div data-region="main"><p>Nothing to act on yet.</p></div>
    `
    const main = document.querySelector<HTMLElement>('[data-region="main"]') as HTMLElement
    byText('Overview').focus()
    expect(moveToRegion(1, new Map())).toBe('main')
    expect(main.getAttribute('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(main)
  })

  it('keeps an existing tabindex on an empty region', () => {
    document.body.innerHTML = '<footer data-region="status" tabindex="-1" aria-label="Status"><span>Synced 09:42</span></footer>'
    expect(moveToRegion(1, new Map())).toBe('status')
    expect(document.activeElement).toBe(document.querySelector('footer'))
  })

  it('does nothing when there are no regions', () => {
    document.body.innerHTML = '<button type="button">Alone</button>'
    byText('Alone').focus()
    expect(moveToRegion(1, new Map())).toBeNull()
    expect(document.activeElement).toBe(byText('Alone'))
  })

  it('skips regions behind a modal (inert)', () => {
    buildPatientsWorkspace()
    document.querySelector('main')?.setAttribute('inert', '')
    const visited = Array.from({ length: 4 }, () => moveToRegion(1, new Map()))
    expect(visited).toEqual(['navigation', 'toolbar', 'status', 'navigation'])
  })
})

describe('rememberFocus', () => {
  it('ignores elements outside any region, and non-elements', () => {
    buildPatientsWorkspace()
    const memory: RegionMemory = new Map()
    rememberFocus(memory, byText('Skip to main workspace'))
    rememberFocus(memory, null)
    expect(memory.size).toBe(0)
  })

  it('records SVG and other non-HTML elements only through their HTML region', () => {
    buildPatientsWorkspace()
    const memory: RegionMemory = new Map()
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    byText('Overview').append(svg)
    rememberFocus(memory, svg)
    expect(memory.size).toBe(0)
  })
})
