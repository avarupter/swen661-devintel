import { FIXED_NOW } from '../../../../../tests/renderer/memoryApi'
import { createSeedWorkspace } from '../../../../shared/seed'
import { createBrowserPreviewApi, PREVIEW_STORAGE_KEY } from '../browserPreviewApi'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: jest.fn((key: string) => data.get(key) ?? null),
    setItem: jest.fn((key: string, value: string) => {
      data.set(key, value)
    })
  }
}

function previewWith(storage = memoryStorage(), extra: Partial<Window> = {}) {
  const win = Object.assign(Object.create(window) as Window, extra)
  return { storage, api: createBrowserPreviewApi({ now: () => FIXED_NOW, storage, window: win }) }
}

describe('browser preview API', () => {
  it('seeds the synthetic workspace on first load and keeps it in storage', async () => {
    const { api, storage } = previewWith()
    const result = await api.loadWorkspace()
    expect(result.source).toBe('seed')
    expect(result.workspace.patients).toHaveLength(28)
    expect(result.workspace.patients[0].name).toBe('Avery Park')
    expect(JSON.parse(storage.data.get(PREVIEW_STORAGE_KEY) as string).patients).toHaveLength(28)
  })

  it('reloads what was saved in this browser', async () => {
    const { api, storage } = previewWith()
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.patients[0].plan = ['Edited in the browser preview']
    await expect(api.saveWorkspace(workspace)).resolves.toEqual({ savedAt: FIXED_NOW.toISOString() })
    const reloaded = createBrowserPreviewApi({ now: () => FIXED_NOW, storage })
    const result = await reloaded.loadWorkspace()
    expect(result.source).toBe('file')
    expect(result.workspace.patients[0].plan).toEqual(['Edited in the browser preview'])
  })

  it('replaces a damaged copy with fresh demo data and says so', async () => {
    const { api, storage } = previewWith(memoryStorage({ [PREVIEW_STORAGE_KEY]: '{"version": 2' }))
    const result = await api.loadWorkspace()
    expect(result.source).toBe('recovered')
    expect(JSON.parse(storage.data.get(PREVIEW_STORAGE_KEY) as string).version).toBe(1)
  })

  it('refuses to save an invalid workspace', async () => {
    const { api, storage } = previewWith()
    await expect(api.saveWorkspace({ version: 1 } as never)).rejects.toThrow(/clinic/)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('works without storage, keeping the workspace in memory', async () => {
    const api = createBrowserPreviewApi({ now: () => FIXED_NOW, storage: null })
    await expect(api.loadWorkspace()).resolves.toMatchObject({ source: 'seed' })
    await expect(api.saveWorkspace(createSeedWorkspace(FIXED_NOW))).resolves.toEqual({ savedAt: FIXED_NOW.toISOString() })
  })

  it('falls back to memory when the browser blocks storage', async () => {
    const blocked = Object.create(window) as Window
    Object.defineProperty(blocked, 'localStorage', {
      get() {
        throw new Error('SecurityError')
      }
    })
    const api = createBrowserPreviewApi({ now: () => FIXED_NOW, window: blocked })
    await expect(api.loadWorkspace()).resolves.toMatchObject({ source: 'seed' })
  })

  it('downloads an export instead of showing a save dialog', async () => {
    const { api } = previewWith()
    const patient = createSeedWorkspace(FIXED_NOW).patients[0]
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    URL.createObjectURL = jest.fn(() => 'blob:careconnect/1')
    URL.revokeObjectURL = jest.fn()
    await expect(api.exportPatient({ patient, format: 'txt' })).resolves.toEqual({ filePath: 'CC-1048-avery-park.txt' })
    await expect(api.exportPatient({ patient, format: 'json' })).resolves.toEqual({ filePath: 'CC-1048-avery-park.json' })
    expect(click).toHaveBeenCalledTimes(2)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:careconnect/1')
    click.mockRestore()
  })

  it('answers desktop-only features as unavailable', async () => {
    const { api } = previewWith()
    await expect(api.importPatients()).resolves.toBeNull()
    await expect(api.pickAttachment()).resolves.toBeNull()
    await expect(api.showNotification({ title: 'Follow-up', body: 'Avery Park' })).resolves.toBe(false)
    await expect(api.showContextMenu({ items: [{ id: 'patient.addNote', label: 'Add note' }] })).resolves.toBeNull()
    expect(() => api.updateUiState({} as never)).not.toThrow()
    const unsubscribe = api.onCommand(() => {})
    expect(() => unsubscribe()).not.toThrow()
  })

  it('reports the platform for shortcut labels and the forced-colours state', async () => {
    const mac = previewWith(memoryStorage(), {
      navigator: { platform: 'MacIntel' } as Navigator,
      matchMedia: (() => ({ matches: true })) as unknown as Window['matchMedia']
    })
    await expect(mac.api.getAppInfo()).resolves.toEqual({ platform: 'darwin', version: 'browser preview', isPackaged: false, highContrast: true })
    const windows = previewWith(memoryStorage(), { navigator: { platform: 'Win32' } as Navigator, matchMedia: undefined })
    await expect(windows.api.getAppInfo()).resolves.toMatchObject({ platform: 'browser', highContrast: false })
  })

  it('opens only allow-listed links, in a new tab without an opener', async () => {
    const open = jest.fn()
    const { api } = previewWith(memoryStorage(), { open: open as unknown as Window['open'] })
    await expect(api.openExternal('https://www.w3.org/WAI/WCAG22/quickref/')).resolves.toBe(true)
    await expect(api.openExternal('https://example.com/')).resolves.toBe(false)
    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith('https://www.w3.org/WAI/WCAG22/quickref/', '_blank', 'noopener,noreferrer')
  })

  it('copies with the clipboard API and prints with the browser', async () => {
    const writeText = jest.fn(async () => undefined)
    const print = jest.fn()
    const { api } = previewWith(memoryStorage(), {
      navigator: { platform: 'Win32', clipboard: { writeText } } as unknown as Navigator,
      print
    })
    await api.copyText('CC-1048')
    await api.printPage()
    expect(writeText).toHaveBeenCalledWith('CC-1048')
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('follows forced-colours changes and stops when unsubscribed', () => {
    const listeners = new Set<() => void>()
    const query = {
      matches: false,
      addEventListener: jest.fn((_type: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: jest.fn((_type: string, listener: () => void) => listeners.delete(listener))
    }
    const { api } = previewWith(memoryStorage(), { matchMedia: (() => query) as unknown as Window['matchMedia'] })
    const onTheme = jest.fn()
    const unsubscribe = api.onThemeChanged(onTheme)
    query.matches = true
    listeners.forEach((listener) => listener())
    expect(onTheme).toHaveBeenCalledWith({ highContrast: true, dark: false })
    unsubscribe()
    expect(listeners.size).toBe(0)
    const noMedia = previewWith(memoryStorage(), { matchMedia: undefined })
    expect(() => noMedia.api.onThemeChanged(onTheme)()).not.toThrow()
  })
})
