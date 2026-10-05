/**
 * F6 / Shift+F6 move between application regions, in DOM order:
 * Navigation → Toolbar → Patient list → Detail pane (or Main) → Status.
 * Regions are elements marked `data-region`; each remembers its last focused
 * element so F6 returns you to where you were.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => !element.closest('[inert], [hidden]'))
}

export function regionsIn(root: ParentNode = document): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-region]')).filter((element) => !element.closest('[inert], [hidden]'))
}

export function regionOf(element: Element | null): HTMLElement | null {
  return element?.closest<HTMLElement>('[data-region]') ?? null
}

export type RegionMemory = Map<string, HTMLElement>

/** Records `element` as the last focused element of its region. */
export function rememberFocus(memory: RegionMemory, element: Element | null): void {
  const region = regionOf(element)
  const name = region?.dataset.region
  if (name && element instanceof HTMLElement) memory.set(name, element)
}

function targetFor(region: HTMLElement, memory: RegionMemory): HTMLElement {
  const remembered = memory.get(region.dataset.region ?? '')
  if (remembered && remembered.isConnected && region.contains(remembered) && !remembered.closest('[inert], [hidden]')) return remembered
  const first = focusableWithin(region)[0]
  if (first) return first
  // An empty region still takes focus, so its landmark name is announced.
  if (!region.hasAttribute('tabindex')) region.setAttribute('tabindex', '-1')
  return region
}

/** Moves focus to the next (1) or previous (-1) region; returns the region name. */
export function moveToRegion(direction: 1 | -1, memory: RegionMemory, root: ParentNode = document): string | null {
  const regions = regionsIn(root)
  if (regions.length === 0) return null
  const current = regionOf(document.activeElement)
  const index = current ? regions.indexOf(current) : -1
  const nextIndex = index === -1 ? (direction === 1 ? 0 : regions.length - 1) : (index + direction + regions.length) % regions.length
  const region = regions[nextIndex]
  targetFor(region, memory).focus()
  return region.dataset.region ?? null
}
