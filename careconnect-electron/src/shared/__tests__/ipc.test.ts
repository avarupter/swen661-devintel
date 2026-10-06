import { INVOKE_CHANNELS, IPC } from '../ipc'

describe('IPC channels', () => {
  const channels = Object.values(IPC)

  it('are unique and follow the area:action naming', () => {
    expect(new Set(channels).size).toBe(channels.length)
    for (const channel of channels) expect(channel).toMatch(/^[a-z-]+:[a-z-]+$/)
  })

  it('lists every request/response channel once, and only those', () => {
    expect(new Set(INVOKE_CHANNELS).size).toBe(INVOKE_CHANNELS.length)
    const oneWay: string[] = [IPC.uiState, IPC.command, IPC.themeChanged]
    expect([...INVOKE_CHANNELS, ...oneWay].sort()).toEqual([...channels].sort())
  })

  it('matches the contract table in the design', () => {
    expect([...INVOKE_CHANNELS]).toEqual([
      'workspace:load',
      'workspace:save',
      'patient:export',
      'patients:import',
      'attachment:pick',
      'notification:show',
      'context-menu:show',
      'app:info',
      'external:open',
      'clipboard:write',
      'window:print'
    ])
    expect([IPC.uiState, IPC.command, IPC.themeChanged]).toEqual(['ui:state', 'app:command', 'theme:changed'])
  })
})
