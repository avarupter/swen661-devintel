/**
 * File system operations behind native dialogs (design section 1, "File
 * system operations"): export a patient summary, import patients, and pick a
 * document to attach. The renderer never sees a path it did not get from a
 * dialog the user answered, and attachments record only a name and a size.
 */
import fsPromises from 'node:fs/promises'
import path from 'node:path'
import type { BaseWindow, Dialog, FileFilter, OpenDialogOptions, SaveDialogOptions } from 'electron'
import type { ExportFormat, ExportRequest, ExportResult, ImportResult } from '../shared/api'
import { exportFileName, formatPatientExport } from '../shared/exportFormat'
import { formatBytes } from '../shared/format'
import type { Attachment } from '../shared/model'
import { parsePatientImport, ValidationError } from '../shared/validate'

/** Imports larger than this are refused before they are read. */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024
const MAX_IMPORT_LABEL = '2 MB'

export type FileDialog = Pick<Dialog, 'showSaveDialog' | 'showOpenDialog'>

/** The file operations used here; node:fs/promises satisfies it. */
export interface FileOpsFs {
  readFile(file: string, encoding: 'utf8'): Promise<string>
  writeFile(file: string, data: string, encoding: 'utf8'): Promise<void>
  stat(file: string): Promise<{ size: number }>
}

export interface FileOpsOptions {
  dialog: FileDialog
  fs?: FileOpsFs
  now: () => Date
}

export interface FileOps {
  /** Resolves null when the user cancels the save dialog. */
  exportPatient(win: BaseWindow | null, request: ExportRequest): Promise<ExportResult | null>
  /** Resolves null when the user cancels the open dialog. */
  importPatients(win: BaseWindow | null): Promise<ImportResult | null>
  /** Resolves null when the user cancels the open dialog. */
  pickAttachment(win: BaseWindow | null): Promise<Attachment | null>
}

const FORMAT_FILTERS: Record<ExportFormat, FileFilter> = {
  txt: { name: 'Text', extensions: ['txt'] },
  json: { name: 'JSON', extensions: ['json'] }
}

/** The chosen extension decides the format; any other extension keeps the requested one. */
function formatForPath(filePath: string, requested: ExportFormat): ExportFormat {
  const extension = path.extname(filePath).toLowerCase()
  if (extension === '.json') return 'json'
  if (extension === '.txt') return 'txt'
  return requested
}

export function createFileOps({ dialog, fs = fsPromises, now }: FileOpsOptions): FileOps {
  function showSaveDialog(win: BaseWindow | null, options: SaveDialogOptions) {
    return win ? dialog.showSaveDialog(win, options) : dialog.showSaveDialog(options)
  }

  async function chooseFile(win: BaseWindow | null, options: OpenDialogOptions): Promise<string | null> {
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
    return result.canceled || result.filePaths.length === 0 ? null : result.filePaths[0]
  }

  return {
    async exportPatient(win, { patient, format }) {
      const other: ExportFormat = format === 'txt' ? 'json' : 'txt'
      const result = await showSaveDialog(win, {
        title: 'Export patient summary',
        defaultPath: exportFileName(patient, format),
        filters: [FORMAT_FILTERS[format], FORMAT_FILTERS[other]]
      })
      if (result.canceled || !result.filePath) return null
      const filePath = result.filePath
      await fs.writeFile(filePath, formatPatientExport(patient, formatForPath(filePath, format), now()), 'utf8')
      return { filePath }
    },

    async importPatients(win) {
      const filePath = await chooseFile(win, {
        title: 'Import patients',
        properties: ['openFile'],
        filters: [{ name: 'CareConnect patients (JSON)', extensions: ['json'] }]
      })
      if (!filePath) return null

      const { size } = await fs.stat(filePath)
      if (size > MAX_IMPORT_BYTES) {
        throw new Error(`That file is larger than ${MAX_IMPORT_LABEL} (${formatBytes(size)}).`)
      }
      // Windows Notepad saves UTF-8 with a byte order mark, which JSON.parse rejects.
      const text = (await fs.readFile(filePath, 'utf8')).replace(/^\uFEFF/, '')
      try {
        const { patients, skipped } = parsePatientImport(text)
        return { patients, skipped, filePath }
      } catch (error) {
        if (error instanceof ValidationError) throw new Error(`That file ${error.reason}.`)
        throw error
      }
    },

    async pickAttachment(win) {
      const filePath = await chooseFile(win, { title: 'Attach document', properties: ['openFile'] })
      if (!filePath) return null
      const { size } = await fs.stat(filePath)
      return { name: path.basename(filePath), size }
    }
  }
}
