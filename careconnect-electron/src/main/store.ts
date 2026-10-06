/**
 * The workspace file in the user-data folder (design section 5). Writes go to
 * a temporary file that is renamed into place, so a crash mid-write never
 * leaves a half-written workspace. An unreadable file is set aside, never
 * overwritten, and the demo data is restored.
 */
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import type { LoadResult, SaveResult } from '../shared/api'
import type { Workspace } from '../shared/model'
import { createSeedWorkspace } from '../shared/seed'
import { validateWorkspace, ValidationError } from '../shared/validate'

export const WORKSPACE_FILE_NAME = 'careconnect-workspace.json'

/** The file operations the store uses; node:fs/promises satisfies it. */
export interface StoreFs {
  readFile(file: string, encoding: 'utf8'): Promise<string>
  writeFile(file: string, data: string, encoding: 'utf8'): Promise<void>
  rename(from: string, to: string): Promise<void>
  mkdir(dir: string, options: { recursive: true }): Promise<unknown>
  rm(file: string, options: { force: true }): Promise<void>
  access(file: string): Promise<void>
}

export interface WorkspaceStoreOptions {
  dir: string
  now: () => Date
  fs?: StoreFs
}

export interface WorkspaceStore {
  readonly filePath: string
  load(): Promise<LoadResult>
  save(workspace: unknown): Promise<SaveResult>
}

/** Windows briefly refuses renames while an antivirus scanner or the indexer holds the file. */
const TRANSIENT_RENAME_ERRORS = new Set(['EPERM', 'EACCES', 'EBUSY'])
const RENAME_ATTEMPTS = 4
const RENAME_RETRY_MS = 25
const MAX_BACKUP_SUFFIX = 100

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : undefined
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** "20261005T094200" in local time, for backup file names. */
export function backupTimestamp(date: Date): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  )
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function createWorkspaceStore({ dir, now, fs = fsPromises }: WorkspaceStoreOptions): WorkspaceStore {
  const filePath = path.join(dir, WORKSPACE_FILE_NAME)
  const tempPath = `${filePath}.tmp`

  // One file operation at a time: overlapping saves would otherwise share the temporary file.
  let queue: Promise<unknown> = Promise.resolve()
  function serialise<T>(task: () => Promise<T>): Promise<T> {
    const run = queue.then(task, task)
    queue = run.catch(() => undefined)
    return run
  }

  async function renameIntoPlace(): Promise<void> {
    for (let attempt = 1; ; attempt++) {
      try {
        await fs.rename(tempPath, filePath)
        return
      } catch (error) {
        if (attempt >= RENAME_ATTEMPTS || !TRANSIENT_RENAME_ERRORS.has(errorCode(error) ?? '')) throw error
        await delay(RENAME_RETRY_MS * attempt)
      }
    }
  }

  async function writeAtomically(workspace: Workspace): Promise<void> {
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(tempPath, `${JSON.stringify(workspace, null, 2)}\n`, 'utf8')
    try {
      await renameIntoPlace()
    } catch (error) {
      await fs.rm(tempPath, { force: true }).catch(() => undefined)
      throw error
    }
  }

  async function exists(file: string): Promise<boolean> {
    try {
      await fs.access(file)
      return true
    } catch {
      return false
    }
  }

  /** Renames the unreadable file to careconnect-workspace.corrupt-<timestamp>[-n].json. */
  async function setAside(): Promise<string> {
    const stamp = backupTimestamp(now())
    for (let n = 1; n <= MAX_BACKUP_SUFFIX; n++) {
      const candidate = path.join(dir, `careconnect-workspace.corrupt-${stamp}${n > 1 ? `-${n}` : ''}.json`)
      if (await exists(candidate)) continue
      await fs.rename(filePath, candidate)
      return candidate
    }
    throw new Error('too many backups were made in the same second')
  }

  async function seed(): Promise<Workspace> {
    const workspace = createSeedWorkspace(now())
    try {
      await writeAtomically(workspace)
    } catch (error) {
      // The demo data still opens; the next autosave tries again and reports any failure.
      console.error(`CareConnect could not write ${filePath}:`, error)
    }
    return workspace
  }

  async function recover(): Promise<LoadResult> {
    let backupPath: string
    try {
      backupPath = await setAside()
    } catch (error) {
      throw new Error(`Your saved workspace (${filePath}) could not be read, and it could not be set aside safely: ${describe(error)}`)
    }
    return { workspace: await seed(), source: 'recovered', backupPath }
  }

  function load(): Promise<LoadResult> {
    return serialise(async () => {
      let text: string
      try {
        text = await fs.readFile(filePath, 'utf8')
      } catch (error) {
        if (errorCode(error) === 'ENOENT') return { workspace: await seed(), source: 'seed' }
        return recover()
      }
      try {
        return { workspace: validateWorkspace(JSON.parse(text)), source: 'file' }
      } catch {
        return recover()
      }
    })
  }

  function save(input: unknown): Promise<SaveResult> {
    let workspace: Workspace
    try {
      workspace = validateWorkspace(input)
    } catch (error) {
      const reason = error instanceof ValidationError ? `The workspace is not valid (${error.message})` : describe(error)
      return Promise.reject(new Error(reason))
    }
    return serialise(async () => {
      await writeAtomically(workspace)
      return { savedAt: now().toISOString() }
    })
  }

  return { filePath, load, save }
}
