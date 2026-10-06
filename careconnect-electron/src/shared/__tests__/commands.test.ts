import { COMMAND_IDS, COMMAND_LABELS, isCommandId, navigateCommand, VIEW_IDS, VIEW_LABELS, viewForCommand, type ViewId } from '../commands'

describe('command ids', () => {
  it('are unique', () => {
    expect(new Set(COMMAND_IDS).size).toBe(COMMAND_IDS.length)
  })

  it.each(COMMAND_IDS)('isCommandId accepts %s', (id) => {
    expect(isCommandId(id)).toBe(true)
  })

  it.each<[string, unknown]>([
    ['an unknown id', 'navigate.nowhere'],
    ['a different case', 'NAVIGATE.INBOX'],
    ['a prefix', 'navigate.'],
    ['an empty string', ''],
    ['a number', 42],
    ['null', null],
    ['undefined', undefined],
    ['an object', { id: 'app.help' }],
    ['an inherited property name', 'toString']
  ])('isCommandId rejects %s', (_name, value) => {
    expect(isCommandId(value)).toBe(false)
  })

  it('has a navigate command for every view', () => {
    expect(COMMAND_IDS.filter((id) => id.startsWith('navigate.'))).toHaveLength(VIEW_IDS.length)
  })
})

describe('views', () => {
  it.each(VIEW_IDS)('navigateCommand(%s) round-trips through viewForCommand', (view: ViewId) => {
    const id = navigateCommand(view)
    expect(id).toBe(`navigate.${view}`)
    expect(isCommandId(id)).toBe(true)
    expect(viewForCommand(id)).toBe(view)
  })

  it.each(COMMAND_IDS.filter((id) => !id.startsWith('navigate.')))('viewForCommand(%s) is null', (id) => {
    expect(viewForCommand(id)).toBeNull()
  })

  it('labels every view', () => {
    expect(VIEW_IDS.map((view) => VIEW_LABELS[view])).toEqual(['Overview', 'Schedule', 'Patients', 'Inbox', 'Tasks', 'Reports', 'Resources'])
  })
})

describe('COMMAND_LABELS', () => {
  it('labels every command, with no two commands sharing a label', () => {
    expect(Object.keys(COMMAND_LABELS).sort()).toEqual([...COMMAND_IDS].sort())
    const labels = COMMAND_IDS.map((id) => COMMAND_LABELS[id])
    for (const label of labels) expect(label).toMatch(/^[A-Z]\S.*\S$/)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('names navigation commands after their views', () => {
    for (const view of VIEW_IDS) expect(COMMAND_LABELS[navigateCommand(view)]).toBe(`Open ${VIEW_LABELS[view]}`)
  })
})
