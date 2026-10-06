import type { WebContents } from 'electron'
import { IPC } from '../../shared/ipc'
import { FakeWebContents } from '../../../tests/mocks/electron'
import { createCommandChannel, MAX_PENDING_COMMANDS } from '../commandChannel'

function setup() {
  const contents = new FakeWebContents()
  const channel = createCommandChannel()
  channel.attach(contents as unknown as WebContents)
  return { contents, channel }
}

describe('createCommandChannel', () => {
  it('holds commands until the renderer reports that it is ready, then delivers them in order', () => {
    const { contents, channel } = setup()
    channel.send({ id: 'patient.new' })
    channel.send({ id: 'navigate.inbox' })
    expect(contents.send).not.toHaveBeenCalled()

    channel.markReady()
    expect(contents.sent).toEqual([
      [IPC.command, { id: 'patient.new' }],
      [IPC.command, { id: 'navigate.inbox' }]
    ])
  })

  it('delivers immediately once the renderer is ready', () => {
    const { contents, channel } = setup()
    channel.markReady()
    channel.send({ id: 'patient.open', patientId: 'p-avery-park' })
    expect(contents.sent).toEqual([[IPC.command, { id: 'patient.open', patientId: 'p-avery-park' }]])
  })

  it('holds commands again while the page reloads', () => {
    const { contents, channel } = setup()
    channel.markReady()
    contents.emit('did-start-loading')
    channel.send({ id: 'app.help' })
    expect(contents.send).not.toHaveBeenCalled()
    channel.markReady()
    expect(contents.sent).toEqual([[IPC.command, { id: 'app.help' }]])
  })

  it('keeps commands for a destroyed renderer until a new one is attached and ready', () => {
    const { contents, channel } = setup()
    channel.markReady()
    contents.destroyed = true
    channel.send({ id: 'navigate.inbox' })
    expect(contents.send).not.toHaveBeenCalled()

    const next = new FakeWebContents()
    channel.attach(next as unknown as WebContents)
    channel.send({ id: 'patient.new' })
    expect(next.send).not.toHaveBeenCalled()
    channel.markReady()
    expect(next.sent).toEqual([
      [IPC.command, { id: 'navigate.inbox' }],
      [IPC.command, { id: 'patient.new' }]
    ])
  })

  it('ignores reload events from a renderer it no longer targets', () => {
    const { contents, channel } = setup()
    const next = new FakeWebContents()
    channel.attach(next as unknown as WebContents)
    channel.markReady()
    contents.emit('did-start-loading')
    channel.send({ id: 'app.settings' })
    expect(next.sent).toEqual([[IPC.command, { id: 'app.settings' }]])
  })

  it(`keeps only the latest ${MAX_PENDING_COMMANDS} commands while waiting`, () => {
    const { contents, channel } = setup()
    for (let i = 0; i < MAX_PENDING_COMMANDS + 5; i++) channel.send({ id: i % 2 === 0 ? 'navigate.inbox' : 'navigate.tasks' })
    channel.markReady()
    expect(contents.sent).toHaveLength(MAX_PENDING_COMMANDS)
  })

  it('holds commands sent before any renderer is attached', () => {
    const channel = createCommandChannel()
    channel.send({ id: 'patient.new' })
    channel.markReady()
    const contents = new FakeWebContents()
    channel.attach(contents as unknown as WebContents)
    channel.markReady()
    expect(contents.sent).toEqual([[IPC.command, { id: 'patient.new' }]])
  })
})
