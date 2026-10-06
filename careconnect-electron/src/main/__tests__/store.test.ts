import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { Workspace } from '../../shared/model'
import { createSeedWorkspace } from '../../shared/seed'
import { createWorkspaceStore, type StoreFs, WORKSPACE_FILE_NAME } from '../store'

/** Monday 5 October 2026, 09:42 local time. */
const NOW = new Date(2026, 9, 5, 9, 42, 0, 0)
const now = (): Date => NOW

let dir: string

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'careconnect-store-'))
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

function workspaceFile(): string {
  return path.join(dir, WORKSPACE_FILE_NAME)
}

function readSaved(): Workspace {
  return JSON.parse(fs.readFileSync(workspaceFile(), 'utf8')) as Workspace
}

function errno(code: string, message = code): NodeJS.ErrnoException {
  return Object.assign(new Error(message), { code })
}

describe('load', () => {
  it('seeds the demo workspace on first run and writes it to disk', async () => {
    const store = createWorkspaceStore({ dir, now })
    expect(store.filePath).toBe(path.join(dir, 'careconnect-workspace.json'))

    const result = await store.load()
    expect(result.source).toBe('seed')
    expect(result.backupPath).toBeUndefined()
    expect(result.workspace.patients).toHaveLength(28)
    expect(result.workspace).toEqual(createSeedWorkspace(NOW))
    expect(readSaved()).toEqual(result.workspace)
  })

  it('seeds relative to the injected clock, so "Today, 10:30" stays true', async () => {
    const { workspace } = await createWorkspaceStore({ dir, now }).load()
    const avery = workspace.patients.find((patient) => patient.name === 'Avery Park')
    expect(new Date(avery?.nextVisit as string)).toEqual(new Date(2026, 9, 5, 10, 30))
  })

  it('creates a missing data directory', async () => {
    const nested = path.join(dir, 'Roaming', 'CareConnect')
    const result = await createWorkspaceStore({ dir: nested, now }).load()
    expect(result.source).toBe('seed')
    expect(fs.existsSync(path.join(nested, WORKSPACE_FILE_NAME))).toBe(true)
  })

  it('still opens the demo data when the seed cannot be written', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    const failingFs: StoreFs = { ...fsPromises, writeFile: jest.fn(async () => Promise.reject(errno('ENOSPC', 'ENOSPC: no space left on device'))) }
    const result = await createWorkspaceStore({ dir, now, fs: failingFs }).load()
    expect(result.source).toBe('seed')
    expect(result.workspace.patients).toHaveLength(28)
    expect(fs.existsSync(workspaceFile())).toBe(false)
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })

  it('loads a saved workspace and strips fields it does not know', async () => {
    const saved = createSeedWorkspace(NOW)
    saved.clinic.name = 'Harbor View Clinic'
    fs.writeFileSync(workspaceFile(), JSON.stringify({ ...saved, injected: '<script>' }))

    const result = await createWorkspaceStore({ dir, now }).load()
    expect(result.source).toBe('file')
    expect(result.workspace.clinic.name).toBe('Harbor View Clinic')
    expect(result.workspace).not.toHaveProperty('injected')
  })

  it('backs up a corrupt file and reseeds', async () => {
    fs.writeFileSync(workspaceFile(), '{"version": 1, "patients": [')

    const result = await createWorkspaceStore({ dir, now }).load()
    expect(result.source).toBe('recovered')
    expect(result.backupPath).toBe(path.join(dir, 'careconnect-workspace.corrupt-20261005T094200.json'))
    expect(fs.readFileSync(result.backupPath as string, 'utf8')).toBe('{"version": 1, "patients": [')
    expect(result.workspace).toEqual(createSeedWorkspace(NOW))
    expect(readSaved()).toEqual(result.workspace)
  })

  it('backs up a file that is valid JSON but not a valid workspace', async () => {
    fs.writeFileSync(workspaceFile(), JSON.stringify({ version: 2, patients: [] }))
    const result = await createWorkspaceStore({ dir, now }).load()
    expect(result.source).toBe('recovered')
    expect(fs.existsSync(result.backupPath as string)).toBe(true)
  })

  it('never overwrites an earlier backup made in the same second', async () => {
    const store = createWorkspaceStore({ dir, now })
    fs.writeFileSync(workspaceFile(), 'first corrupt copy')
    const first = await store.load()
    fs.writeFileSync(workspaceFile(), 'second corrupt copy')
    const second = await store.load()

    expect(second.backupPath).toBe(path.join(dir, 'careconnect-workspace.corrupt-20261005T094200-2.json'))
    expect(fs.readFileSync(first.backupPath as string, 'utf8')).toBe('first corrupt copy')
    expect(fs.readFileSync(second.backupPath as string, 'utf8')).toBe('second corrupt copy')
  })

  it('treats an unreadable file like a corrupt one', async () => {
    fs.writeFileSync(workspaceFile(), JSON.stringify(createSeedWorkspace(NOW)))
    const lockedFs: StoreFs = {
      ...fsPromises,
      readFile: jest.fn(async () => Promise.reject(errno('EACCES', 'EACCES: permission denied')))
    }
    const result = await createWorkspaceStore({ dir, now, fs: lockedFs }).load()
    expect(result.source).toBe('recovered')
    expect(fs.existsSync(result.backupPath as string)).toBe(true)
  })

  it('refuses to replace a corrupt file it cannot set aside', async () => {
    fs.writeFileSync(workspaceFile(), 'corrupt')
    const stuckFs: StoreFs = {
      ...fsPromises,
      rename: jest.fn(async () => Promise.reject(errno('EXDEV', 'EXDEV: cross-device link not permitted')))
    }
    await expect(createWorkspaceStore({ dir, now, fs: stuckFs }).load()).rejects.toThrow(
      /could not be read, and it could not be set aside.*EXDEV/
    )
    expect(fs.readFileSync(workspaceFile(), 'utf8')).toBe('corrupt')
  })
})

describe('save', () => {
  it('round-trips: a fresh store loads what was saved', async () => {
    const store = createWorkspaceStore({ dir, now })
    const { workspace } = await store.load()
    workspace.patients[0].plan.push('Book the next wellness check')
    workspace.preferences.highContrast = true

    await expect(store.save(workspace)).resolves.toEqual({ savedAt: NOW.toISOString() })

    const reloaded = await createWorkspaceStore({ dir, now }).load()
    expect(reloaded.source).toBe('file')
    expect(reloaded.workspace.patients[0].plan).toContain('Book the next wellness check')
    expect(reloaded.workspace.preferences.highContrast).toBe(true)
  })

  it('creates the data directory if it is missing', async () => {
    const nested = path.join(dir, 'new-profile')
    await createWorkspaceStore({ dir: nested, now }).save(createSeedWorkspace(NOW))
    expect(fs.existsSync(path.join(nested, WORKSPACE_FILE_NAME))).toBe(true)
  })

  it('rejects an invalid workspace with a clear message and leaves the file untouched', async () => {
    const store = createWorkspaceStore({ dir, now })
    await store.load()
    const before = fs.readFileSync(workspaceFile(), 'utf8')

    const invalid = createSeedWorkspace(NOW)
    invalid.patients[0].name = '   '
    await expect(store.save(invalid)).rejects.toThrow('The workspace is not valid (workspace.patients[0].name: must not be empty)')
    await expect(store.save(null)).rejects.toThrow('The workspace is not valid (workspace: expected an object)')
    await expect(store.save({ ...createSeedWorkspace(NOW), version: 3 })).rejects.toThrow(/workspace\.version/)

    expect(fs.readFileSync(workspaceFile(), 'utf8')).toBe(before)
    expect(fs.readdirSync(dir)).toEqual([WORKSPACE_FILE_NAME])
  })

  it('writes only the fields it knows', async () => {
    const store = createWorkspaceStore({ dir, now })
    await store.save({ ...createSeedWorkspace(NOW), debug: { secret: true } })
    expect(readSaved()).not.toHaveProperty('debug')
  })

  it('writes atomically through a temporary file and leaves nothing behind', async () => {
    const renames: [string, string][] = []
    const watchedFs: StoreFs = {
      ...fsPromises,
      rename: jest.fn(async (from: string, to: string) => {
        renames.push([from, to])
        return fsPromises.rename(from, to)
      })
    }
    await createWorkspaceStore({ dir, now, fs: watchedFs }).save(createSeedWorkspace(NOW))
    expect(renames).toEqual([[`${workspaceFile()}.tmp`, workspaceFile()]])
    expect(fs.readdirSync(dir)).toEqual([WORKSPACE_FILE_NAME])
  })

  it('removes the temporary file and keeps the old file when the final rename fails', async () => {
    const store = createWorkspaceStore({ dir, now })
    await store.load()
    const before = fs.readFileSync(workspaceFile(), 'utf8')
    const failingFs: StoreFs = { ...fsPromises, rename: jest.fn(async () => Promise.reject(errno('ENOSPC', 'ENOSPC: no space left on device'))) }

    const changed = createSeedWorkspace(NOW)
    changed.clinic.name = 'Changed'
    await expect(createWorkspaceStore({ dir, now, fs: failingFs }).save(changed)).rejects.toThrow('ENOSPC')
    expect(fs.readFileSync(workspaceFile(), 'utf8')).toBe(before)
    expect(fs.readdirSync(dir)).toEqual([WORKSPACE_FILE_NAME])
  })

  it('retries a rename that Windows briefly refuses (antivirus or indexer holding the file)', async () => {
    let refusals = 0
    const flakyFs: StoreFs = {
      ...fsPromises,
      rename: jest.fn(async (from: string, to: string) => {
        if (refusals < 2) {
          refusals += 1
          throw errno('EPERM', 'EPERM: operation not permitted, rename')
        }
        return fsPromises.rename(from, to)
      })
    }
    await expect(createWorkspaceStore({ dir, now, fs: flakyFs }).save(createSeedWorkspace(NOW))).resolves.toEqual({
      savedAt: NOW.toISOString()
    })
    expect(flakyFs.rename).toHaveBeenCalledTimes(3)
    expect(readSaved().patients).toHaveLength(28)
  })

  it('serialises overlapping saves so the last one wins and no write is torn', async () => {
    const store = createWorkspaceStore({ dir, now })
    const first = createSeedWorkspace(NOW)
    first.clinic.name = 'First'
    const second = createSeedWorkspace(NOW)
    second.clinic.name = 'Second'

    await Promise.all([store.save(first), store.save(second)])
    expect(readSaved().clinic.name).toBe('Second')
    expect(fs.readdirSync(dir)).toEqual([WORKSPACE_FILE_NAME])
  })

  it('keeps saving after a failed save', async () => {
    let failNext = true
    const onceFailingFs: StoreFs = {
      ...fsPromises,
      writeFile: jest.fn(async (file: string, data: string, encoding: 'utf8') => {
        if (failNext) {
          failNext = false
          throw errno('EIO', 'EIO: i/o error')
        }
        return fsPromises.writeFile(file, data, encoding)
      })
    }
    const store = createWorkspaceStore({ dir, now, fs: onceFailingFs })
    await expect(store.save(createSeedWorkspace(NOW))).rejects.toThrow('EIO')
    await expect(store.save(createSeedWorkspace(NOW))).resolves.toEqual({ savedAt: NOW.toISOString() })
  })
})
