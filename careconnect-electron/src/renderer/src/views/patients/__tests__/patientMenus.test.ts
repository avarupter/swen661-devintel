import type { ContextMenuItem } from '../../../../../shared/api'
import { createSeedWorkspace } from '../../../../../shared/seed'
import { LIMITS, validateContextMenuRequest } from '../../../../../shared/validate'
import { patientContextMenuItems } from '../../../commands/patientContextMenu'
import {
  chosenOption,
  FILTER_OPTIONS,
  filterAnnouncement,
  fitMenuLabels,
  menuPosition,
  patientOptionId,
  patientOptionName,
  radioItems,
  resultCountLabel,
  SORT_OPTIONS,
  sortAnnouncement
} from '../patientMenus'

const NOW = new Date(2026, 9, 5, 9, 42)

function elementAt(rect: Partial<DOMRect>): Element {
  const element = document.createElement('div')
  element.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}), ...rect })
  return element
}

describe('patient menu helpers', () => {
  it('builds radio items with the current choice checked', () => {
    expect(radioItems(SORT_OPTIONS, 'nextVisit')).toEqual([
      { id: 'recent', label: 'Recent activity', type: 'radio', checked: false },
      { id: 'name', label: 'Name', type: 'radio', checked: false },
      { id: 'nextVisit', label: 'Next visit', type: 'radio', checked: true },
      { id: 'status', label: 'Status', type: 'radio', checked: false }
    ])
  })

  it('maps a menu choice back to its option, and a dismissed or unknown choice to nothing', () => {
    expect(chosenOption(FILTER_OPTIONS, 'open')).toEqual({ id: 'open', label: 'Open' })
    expect(chosenOption(FILTER_OPTIONS, null)).toBeUndefined()
    expect(chosenOption(FILTER_OPTIONS, 'patient.addNote')).toBeUndefined()
  })

  it('words result counts and announcements', () => {
    expect(resultCountLabel(0)).toBe('No results')
    expect(resultCountLabel(1)).toBe('1 result')
    expect(resultCountLabel(28)).toBe('28 results')
    expect(filterAnnouncement('needs-review', 8)).toBe('Showing Needs review patients, 8 results')
    expect(filterAnnouncement('completed', 1)).toBe('Showing Completed patients, 1 result')
    expect(filterAnnouncement('all', 0)).toBe('Showing all patients, 0 results')
    expect(sortAnnouncement('recent')).toBe('Sorted by recent activity')
    expect(sortAnnouncement('nextVisit')).toBe('Sorted by next visit')
  })

  it('names patient options as "<name>, <secondary>. <status>"', () => {
    const [avery, morgan] = createSeedWorkspace(NOW).patients
    expect(patientOptionId(avery.id)).toBe('patient-option-p-avery-park')
    expect(patientOptionName(avery, NOW)).toBe('Avery Park, Wellness follow-up · 10:30. Needs review')
    expect(patientOptionName(morgan, NOW)).toBe('Morgan Chen, Care plan update · Today. Open')
  })

  describe('menuPosition', () => {
    it('uses the pointer for a mouse right-click', () => {
      expect(menuPosition(elementAt({ left: 10, bottom: 20 }), { clientX: 300.4, clientY: 120.6 })).toEqual({ x: 300, y: 121 })
    })

    it('falls back to the element’s bottom-left for keyboard requests at 0,0', () => {
      expect(menuPosition(elementAt({ left: 272.2, bottom: 361.5 }), { clientX: 0, clientY: 0 })).toEqual({ x: 272, y: 362 })
      expect(menuPosition(elementAt({ left: 40, bottom: 80 }))).toEqual({ x: 40, y: 80 })
    })

    it('clamps coordinates the main process would reject', () => {
      expect(menuPosition(elementAt({ left: -12, bottom: Number.NaN }))).toEqual({ x: 0, y: 0 })
      expect(menuPosition(null, { clientX: -5, clientY: 9 })).toEqual({ x: 0, y: 9 })
    })

    it('omits the position (the pointer is used) when there is no element', () => {
      expect(menuPosition(null)).toEqual({})
    })
  })

  describe('fitMenuLabels', () => {
    const [avery] = createSeedWorkspace(NOW).patients

    it('leaves labels within the main process’s limit untouched', () => {
      const items = patientContextMenuItems(avery)
      const fitted = fitMenuLabels(items)
      expect(fitted).toEqual(items)
      fitted.forEach((item, index) => expect(item).toBe(items[index]))
    })

    it('shortens a label over the limit to exactly the limit, ending in an ellipsis', () => {
      const long: ContextMenuItem = { id: 'patient.message', label: `Message ${'A'.repeat(200)}…`, accelerator: 'M' }
      const [fitted] = fitMenuLabels([long])
      expect(fitted.label).toHaveLength(LIMITS.shortText)
      expect(fitted.label).toBe(`Message ${'A'.repeat(LIMITS.shortText - 'Message '.length - 1)}…`)
      expect(fitted).toMatchObject({ id: 'patient.message', accelerator: 'M' })
    })

    it('does not leave a space before the ellipsis, or half of a surrogate pair', () => {
      const spaced = fitMenuLabels([{ id: 'a', label: `${'x'.repeat(5)} ${'y'.repeat(20)}` }], 7)
      expect(spaced[0].label).toBe('xxxxx…')
      const astral = fitMenuLabels([{ id: 'b', label: `${'x'.repeat(5)}😀😀` }], 7)
      expect(astral[0].label).toBe('xxxxx…')
      expect(astral[0].label.length).toBeLessThanOrEqual(7)
    })

    it('makes the menu of a patient with a maximum-length name and Care ID pass the main-process validator', () => {
      const longest = { ...avery, name: 'N'.repeat(LIMITS.shortText), careId: 'C'.repeat(LIMITS.shortText) }
      expect(() => validateContextMenuRequest({ items: patientContextMenuItems(longest), x: 1, y: 1 })).toThrow(/must be at most 200 characters/)
      const request = validateContextMenuRequest({ items: fitMenuLabels(patientContextMenuItems(longest)), x: 1, y: 1 })
      const labels = request.items.map((item) => item.label)
      expect(labels[0]).toMatch(/^Message N+…$/)
      expect(labels.find((label) => label.startsWith('Copy Care ID'))).toMatch(/^Copy Care ID \(C+…$/)
      // Separators keep their empty labels, and short labels are unchanged.
      expect(labels).toContain('Edit care summary…')
      expect(request.items.filter((item) => item.type === 'separator').map((item) => item.label)).toEqual(['', ''])
    })
  })
})
