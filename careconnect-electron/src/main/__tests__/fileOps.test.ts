import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import type { BaseWindow } from 'electron'
import type { Patient } from '../../shared/model'
import { createSeedWorkspace } from '../../shared/seed'
import { parsePatientImport } from '../../shared/validate'
import { createFileOps, type FileDialog, type FileOpsFs, MAX_IMPORT_BYTES } from '../fileOps'

const NOW = new Date(2026, 9, 5, 9, 42, 0, 0)
const WINDOW = { id: 1 } as unknown as BaseWindow

let dir: string
let avery: Patient
let morgan: Patient

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'careconnect-files-'))
  ;[avery, morgan] = createSeedWorkspace(NOW).patients
})

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

function fakeDialog() {
  return {
    showSaveDialog: jest.fn(async (..._args: unknown[]) => ({ canceled: true, filePath: '' })),
    showOpenDialog: jest.fn(async (..._args: unknown[]) => ({ canceled: true, filePaths: [] as string[] }))
  }
}

function setup(fileSystem: FileOpsFs = fsPromises) {
  const dialog = fakeDialog()
  const ops = createFileOps({ dialog: dialog as unknown as FileDialog, fs: fileSystem, now: () => NOW })
  const chooseSavePath = (filePath: string) => dialog.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath })
  const chooseOpenPath = (filePath: string) => dialog.showOpenDialog.mockResolvedValueOnce({ canceled: false, filePaths: [filePath] })
  return { dialog, ops, chooseSavePath, chooseOpenPath }
}

describe('exportPatient', () => {
  it('asks where to save, suggesting a file name from the Care ID and name', async () => {
    const { dialog, ops } = setup()
    await ops.exportPatient(WINDOW, { patient: avery, format: 'txt' })
    expect(dialog.showSaveDialog).toHaveBeenCalledWith(WINDOW, {
      title: 'Export patient summary',
      defaultPath: 'CC-1048-avery-park.txt',
      filters: [
        { name: 'Text', extensions: ['txt'] },
        { name: 'JSON', extensions: ['json'] }
      ]
    })
  })

  it('returns null and writes nothing when the dialog is cancelled', async () => {
    const { dialog, ops } = setup()
    await expect(ops.exportPatient(WINDOW, { patient: avery, format: 'txt' })).resolves.toBeNull()
    dialog.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '' })
    await expect(ops.exportPatient(WINDOW, { patient: avery, format: 'txt' })).resolves.toBeNull()
    expect(fs.readdirSync(dir)).toEqual([])
  })

  it('writes a text summary containing the patient name and Care ID', async () => {
    const { ops, chooseSavePath } = setup()
    const target = path.join(dir, 'avery.txt')
    chooseSavePath(target)

    await expect(ops.exportPatient(WINDOW, { patient: avery, format: 'txt' })).resolves.toEqual({ filePath: target })
    const text = fs.readFileSync(target, 'utf8')
    expect(text).toContain('Avery Park')
    expect(text).toContain('CC-1048')
    expect(text).toContain('Synthetic demo record')
  })

  it('writes JSON when the user chooses a .json file, and the file imports back', async () => {
    const { ops, chooseSavePath } = setup()
    const target = path.join(dir, 'avery.JSON')
    chooseSavePath(target)

    await ops.exportPatient(WINDOW, { patient: avery, format: 'txt' })
    const parsed = parsePatientImport(fs.readFileSync(target, 'utf8'))
    expect(parsed).toEqual({ patients: [avery], skipped: 0 })
  })

  it('writes text when the user chooses a .txt file for a JSON request', async () => {
    const { ops, chooseSavePath } = setup()
    const target = path.join(dir, 'avery.txt')
    chooseSavePath(target)
    await ops.exportPatient(WINDOW, { patient: avery, format: 'json' })
    expect(fs.readFileSync(target, 'utf8')).toMatch(/^CareConnect — Patient summary/)
  })

  it('offers the requested format first and keeps it for other extensions', async () => {
    const { dialog, ops, chooseSavePath } = setup()
    const target = path.join(dir, 'avery.export')
    chooseSavePath(target)
    await ops.exportPatient(WINDOW, { patient: avery, format: 'json' })
    expect(dialog.showSaveDialog.mock.calls[0][1]).toMatchObject({
      defaultPath: 'CC-1048-avery-park.json',
      filters: [
        { name: 'JSON', extensions: ['json'] },
        { name: 'Text', extensions: ['txt'] }
      ]
    })
    expect(JSON.parse(fs.readFileSync(target, 'utf8'))).toMatchObject({ format: 'careconnect.patient.v1', synthetic: true })
  })

  it('opens an unparented dialog when there is no window', async () => {
    const { dialog, ops } = setup()
    await ops.exportPatient(null, { patient: avery, format: 'txt' })
    expect(dialog.showSaveDialog).toHaveBeenCalledWith(expect.objectContaining({ title: 'Export patient summary' }))
    expect(dialog.showSaveDialog.mock.calls[0]).toHaveLength(1)
  })

  it('rejects when the file cannot be written', async () => {
    const { ops, chooseSavePath } = setup()
    chooseSavePath(path.join(dir, 'missing-folder', 'avery.txt'))
    await expect(ops.exportPatient(WINDOW, { patient: avery, format: 'txt' })).rejects.toThrow('ENOENT')
  })
})

describe('importPatients', () => {
  function writeJson(name: string, value: unknown): string {
    const file = path.join(dir, name)
    fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value))
    return file
  }

  it('asks for one JSON file', async () => {
    const { dialog, ops } = setup()
    await ops.importPatients(WINDOW)
    expect(dialog.showOpenDialog).toHaveBeenCalledWith(WINDOW, {
      title: 'Import patients',
      properties: ['openFile'],
      filters: [{ name: 'CareConnect patients (JSON)', extensions: ['json'] }]
    })
  })

  it('returns null when the dialog is cancelled', async () => {
    const { ops } = setup()
    await expect(ops.importPatients(WINDOW)).resolves.toBeNull()
  })

  it('imports an array of patients', async () => {
    const { ops, chooseOpenPath } = setup()
    const file = writeJson('patients.json', [avery, morgan])
    chooseOpenPath(file)
    await expect(ops.importPatients(WINDOW)).resolves.toEqual({ patients: [avery, morgan], skipped: 0, filePath: file })
  })

  it('imports { patients } and counts invalid records as skipped', async () => {
    const { ops, chooseOpenPath } = setup()
    const file = writeJson('bulk.json', { patients: [avery, { name: 'No id' }, morgan] })
    chooseOpenPath(file)
    await expect(ops.importPatients(WINDOW)).resolves.toEqual({ patients: [avery, morgan], skipped: 1, filePath: file })
  })

  it('imports a single-patient export written by exportPatient', async () => {
    const { ops, chooseSavePath, chooseOpenPath } = setup()
    const file = path.join(dir, 'avery.json')
    chooseSavePath(file)
    await ops.exportPatient(WINDOW, { patient: avery, format: 'json' })
    chooseOpenPath(file)
    await expect(ops.importPatients(WINDOW)).resolves.toEqual({ patients: [avery], skipped: 0, filePath: file })
  })

  it('accepts a file saved with a UTF-8 byte order mark (Windows Notepad)', async () => {
    const { ops, chooseOpenPath } = setup()
    const file = writeJson('notepad.json', `\uFEFF${JSON.stringify([avery])}`)
    chooseOpenPath(file)
    await expect(ops.importPatients(WINDOW)).resolves.toMatchObject({ patients: [avery], skipped: 0 })
  })

  it('rejects a file larger than 2 MB without reading it', async () => {
    const readFile = jest.fn(fsPromises.readFile)
    const { ops, chooseOpenPath } = setup({ ...fsPromises, readFile } as FileOpsFs)
    const file = path.join(dir, 'huge.json')
    fs.writeFileSync(file, Buffer.alloc(MAX_IMPORT_BYTES + 1, 0x20))
    chooseOpenPath(file)
    await expect(ops.importPatients(WINDOW)).rejects.toThrow('That file is larger than 2 MB (2.0 MB).')
    expect(readFile).not.toHaveBeenCalled()
    expect(MAX_IMPORT_BYTES).toBe(2 * 1024 * 1024)
  })

  it('accepts a file of exactly 2 MB', async () => {
    const { ops, chooseOpenPath } = setup()
    const json = JSON.stringify([avery])
    const file = writeJson('exact.json', json + ' '.repeat(MAX_IMPORT_BYTES - Buffer.byteLength(json)))
    chooseOpenPath(file)
    await expect(ops.importPatients(WINDOW)).resolves.toMatchObject({ patients: [avery] })
  })

  it.each([
    ['not JSON', '{"patients": [', 'That file is not valid JSON.'],
    ['JSON without patients', '{"clinic": "North Coast"}', 'That file contains no patients.']
  ])('rejects a file that is %s with a readable reason', async (_label, content, message) => {
    const { ops, chooseOpenPath } = setup()
    chooseOpenPath(writeJson('bad.json', content))
    await expect(ops.importPatients(WINDOW)).rejects.toThrow(message)
  })
})

describe('pickAttachment', () => {
  it('asks for any one file', async () => {
    const { dialog, ops } = setup()
    await ops.pickAttachment(WINDOW)
    expect(dialog.showOpenDialog).toHaveBeenCalledWith(WINDOW, { title: 'Attach document', properties: ['openFile'] })
  })

  it('returns null when the dialog is cancelled', async () => {
    const { ops } = setup()
    await expect(ops.pickAttachment(null)).resolves.toBeNull()
  })

  it('returns the file name and size, never its contents', async () => {
    const { ops, chooseOpenPath } = setup()
    const file = path.join(dir, 'Lab results – October.pdf')
    fs.writeFileSync(file, Buffer.alloc(12_345))
    chooseOpenPath(file)
    await expect(ops.pickAttachment(WINDOW)).resolves.toEqual({ name: 'Lab results – October.pdf', size: 12_345 })
  })
})
