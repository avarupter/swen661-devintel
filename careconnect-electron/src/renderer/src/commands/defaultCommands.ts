/**
 * What each command does when no mounted view or dialog has registered a more
 * specific handler. Written against a small context object rather than React,
 * so it can be tested directly.
 */
import type { CareConnectApi } from '../../../shared/api'
import { isCommandId, viewForCommand, type AppCommand } from '../../../shared/commands'
import { STATUS_LABELS } from '../../../shared/format'
import type { Patient, PatientStatus } from '../../../shared/model'
import { hintForCommand, keyLabel } from '../../../shared/shortcuts'
import { blocksNewModal, type AppAction, type AppState, type Modal, type StatusTone } from '../state/appState'
import { createId } from '../state/ids'
import { matchesPatientQuery, mergeImportedPatients, patientById } from '../state/selectors'
import { patientContextMenuItems } from './patientContextMenu'

export interface CommandContext {
  getState(): AppState
  dispatch(action: AppAction): void
  api: CareConnectApi
  now(): Date
  setStatus(text: string, tone?: StatusTone): void
  /** Opens a modal, remembering the focused control so closing returns focus to it. */
  openModal(modal: Modal): void
  /** Focuses an element by id once the current update has rendered. */
  focusAfterRender(id: string): void
  /** Focuses the current view's registered search field; false if it has none. */
  focusSearch(): boolean
  moveRegion(direction: 1 | -1): void
  run(command: AppCommand): void
}

const STATUS_FOR_COMMAND: Partial<Record<AppCommand['id'], PatientStatus>> = {
  'patient.markCompleted': 'completed',
  'patient.markNeedsReview': 'needs-review',
  'patient.markOpen': 'open'
}

export function describeFailure(error: unknown): string {
  return error instanceof Error ? error.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : String(error)
}

/** A modal may replace the command palette, but never another dialog with unsaved input. */
function canOpenModal(ctx: CommandContext): boolean {
  if (blocksNewModal(ctx.getState().ui.modal)) {
    ctx.setStatus('Close the open dialog first.', 'info')
    return false
  }
  return true
}

function selectedPatient(ctx: CommandContext, command: AppCommand): Patient | null {
  const state = ctx.getState()
  const patient = patientById(state.workspace, command.patientId ?? state.ui.selectedPatientId)
  if (!patient) ctx.setStatus('Select a patient first.', 'warning')
  return patient
}

async function exportSummary(ctx: CommandContext, patient: Patient): Promise<void> {
  try {
    const result = await ctx.api.exportPatient({ patient, format: 'txt' })
    if (result) ctx.setStatus(`Summary for ${patient.name} exported to ${result.filePath}.`, 'success')
  } catch (error) {
    ctx.setStatus(`Couldn't export the summary: ${describeFailure(error)}`, 'error')
  }
}

async function importPatients(ctx: CommandContext): Promise<void> {
  try {
    const result = await ctx.api.importPatients()
    if (!result) return
    const workspace = ctx.getState().workspace
    if (!workspace) return
    const { added, duplicates } = mergeImportedPatients(workspace.patients, result.patients, createId)
    if (added.length > 0) ctx.dispatch({ type: 'patients/imported', patients: added })
    const parts = [`Imported ${added.length} ${added.length === 1 ? 'patient' : 'patients'}.`]
    if (duplicates > 0) parts.push(`${duplicates} already in your list.`)
    if (result.skipped > 0) parts.push(`${result.skipped} invalid ${result.skipped === 1 ? 'record' : 'records'} skipped.`)
    ctx.setStatus(parts.join(' '), added.length > 0 ? 'success' : 'warning')
  } catch (error) {
    ctx.setStatus(`Couldn't import patients: ${describeFailure(error)}`, 'error')
  }
}

async function showPatientContextMenu(ctx: CommandContext, patient: Patient): Promise<void> {
  const choice = await ctx.api.showContextMenu({ items: patientContextMenuItems(patient) })
  if (choice && isCommandId(choice)) ctx.run({ id: choice, patientId: patient.id })
}

function setPatientStatus(ctx: CommandContext, patient: Patient, status: PatientStatus): void {
  const label = STATUS_LABELS[status]
  if (patient.status === status) {
    ctx.setStatus(`${patient.name} is already marked ${label.toLowerCase()}.`, 'info')
    return
  }
  ctx.dispatch({
    type: 'patient/updated',
    patientId: patient.id,
    changes: { status },
    activity: { id: createId('a'), kind: 'record', title: `Status changed to ${label}`, at: ctx.now().toISOString(), author: ctx.getState().workspace?.user.name }
  })
  ctx.setStatus(`${patient.name} marked as ${label.toLowerCase()}.`, 'success')
}

function togglePreference(ctx: CommandContext, key: 'showShortcutHints' | 'highContrast' | 'reduceMotion', on: string, off: string): void {
  const workspace = ctx.getState().workspace
  if (!workspace) return
  const value = !workspace.preferences[key]
  ctx.dispatch({ type: 'preferences/changed', changes: { [key]: value } })
  ctx.setStatus(value ? on : off, 'info')
}

export async function runDefaultCommand(command: AppCommand, ctx: CommandContext): Promise<void> {
  const view = viewForCommand(command.id)
  if (view) {
    ctx.dispatch({ type: 'ui/navigate', view })
    ctx.focusAfterRender('view-title')
    return
  }

  const status = STATUS_FOR_COMMAND[command.id]
  if (status) {
    const patient = selectedPatient(ctx, command)
    if (patient) setPatientStatus(ctx, patient, status)
    return
  }

  switch (command.id) {
    case 'region.next':
      ctx.moveRegion(1)
      return
    case 'region.previous':
      ctx.moveRegion(-1)
      return
    case 'patient.new':
      if (canOpenModal(ctx)) ctx.openModal({ kind: 'newPatient' })
      return
    case 'patient.search':
      if (!ctx.focusSearch()) {
        ctx.dispatch({ type: 'ui/navigate', view: 'patients' })
        ctx.focusAfterRender('patient-search')
      }
      return
    case 'patient.filter':
    case 'patient.sort':
      // The Patients view registers the real handlers; elsewhere, take the user there.
      ctx.dispatch({ type: 'ui/navigate', view: 'patients' })
      ctx.focusAfterRender(`toolbar-${command.id}`)
      return
    case 'patient.open': {
      const patient = patientById(ctx.getState().workspace, command.patientId)
      if (!patient) {
        ctx.setStatus('That patient is no longer in the list.', 'warning')
        return
      }
      // A search or status filter left on in the Patients list could hide the patient being opened.
      const { patientQuery, statusFilter } = ctx.getState().ui
      if (!matchesPatientQuery(patient, patientQuery)) ctx.dispatch({ type: 'ui/setPatientQuery', query: '' })
      if (statusFilter !== 'all' && statusFilter !== patient.status) ctx.dispatch({ type: 'ui/setStatusFilter', filter: 'all' })
      ctx.dispatch({ type: 'ui/selectPatient', patientId: patient.id, at: ctx.now().toISOString() })
      ctx.dispatch({ type: 'ui/navigate', view: 'patients' })
      ctx.focusAfterRender(`patient-option-${patient.id}`)
      return
    }
    case 'patient.editSummary': {
      const patient = selectedPatient(ctx, command)
      if (patient && canOpenModal(ctx)) ctx.openModal({ kind: 'editSummary', patientId: patient.id })
      return
    }
    case 'patient.addNote': {
      const patient = selectedPatient(ctx, command)
      if (patient && canOpenModal(ctx)) ctx.openModal({ kind: 'addNote', patientId: patient.id })
      return
    }
    case 'patient.message': {
      const patient = selectedPatient(ctx, command)
      if (!patient || !canOpenModal(ctx)) return
      const conversation = ctx.getState().workspace?.conversations.find((entry) => entry.patientId === patient.id) ?? null
      ctx.openModal({ kind: 'compose', patientId: patient.id, conversationId: conversation?.id ?? null, draftId: null })
      return
    }
    case 'patient.contextMenu': {
      const patient = selectedPatient(ctx, command)
      if (patient) await showPatientContextMenu(ctx, patient)
      return
    }
    case 'patient.export': {
      const patient = selectedPatient(ctx, command)
      if (patient) await exportSummary(ctx, patient)
      return
    }
    case 'patient.copyCareId': {
      const patient = selectedPatient(ctx, command)
      if (!patient) return
      try {
        await ctx.api.copyText(patient.careId)
        ctx.setStatus(`Care ID ${patient.careId} copied.`, 'success')
      } catch (error) {
        ctx.setStatus(`Couldn't copy the Care ID: ${describeFailure(error)}`, 'error')
      }
      return
    }
    case 'patient.import':
      await importPatients(ctx)
      return
    case 'message.new':
      if (canOpenModal(ctx)) ctx.openModal({ kind: 'compose', patientId: null, conversationId: null, draftId: null })
      return
    case 'message.reply':
      // The Inbox registers the real handler while a conversation is open.
      ctx.dispatch({ type: 'ui/navigate', view: 'inbox' })
      ctx.setStatus('Choose a conversation, then press R to reply.', 'info')
      return
    case 'message.send':
    case 'message.saveDraft':
    case 'message.attach':
      // The compose dialog registers these while it is open.
      ctx.setStatus(`Open a message first (${hintForCommand('message.new', ctx.getState().ui.platform)} for a new one).`, 'info')
      return
    case 'app.commandPalette':
      if (canOpenModal(ctx)) ctx.openModal({ kind: 'palette' })
      return
    case 'app.shortcuts':
      if (canOpenModal(ctx)) ctx.openModal({ kind: 'shortcuts' })
      return
    case 'app.help':
      if (canOpenModal(ctx)) ctx.openModal({ kind: 'help' })
      return
    case 'app.settings':
      if (canOpenModal(ctx)) ctx.openModal({ kind: 'settings' })
      return
    case 'view.toggleShortcutHints':
      togglePreference(ctx, 'showShortcutHints', 'Shortcut hints shown.', `Shortcut hints hidden. Hold ${keyLabel('Alt', ctx.getState().ui.platform)} to see them.`)
      return
    case 'view.toggleHighContrast':
      togglePreference(ctx, 'highContrast', 'High contrast theme on.', 'High contrast theme off.')
      return
    case 'view.toggleReduceMotion':
      togglePreference(ctx, 'reduceMotion', 'Reduce motion on.', 'Reduce motion off.')
      return
  }
}
