/**
 * What File > Export Patient Summary writes. Exported files outlive the day
 * they were made, so dates are absolute ("Mon, Oct 5, 2026, 10:30"), never
 * "Today".
 */
import type { ExportFormat } from './api'
import { formatLongDateTime, STATUS_LABELS } from './format'
import type { Patient } from './model'

export const PATIENT_EXPORT_FORMAT = 'careconnect.patient.v1'

export function exportFileName(patient: Patient, format: ExportFormat): string {
  const slug = patient.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${patient.careId}-${slug || 'patient'}.${format}`
}

export function formatPatientSummaryText(patient: Patient, exportedAt: Date): string {
  const field = (label: string, value: string) => `${`${label}:`.padEnd(14)}${value}`
  const lines = [
    'CareConnect — Patient summary',
    'Synthetic demo record. Not real patient data.',
    '',
    field('Name', patient.name),
    field('Pronouns', patient.pronouns || 'Not recorded'),
    field('Age group', patient.ageGroup || 'Not recorded'),
    field('Care ID', patient.careId),
    field('Status', STATUS_LABELS[patient.status]),
    field('Reason', patient.reason),
    field('Last contact', formatLongDateTime(patient.lastContact)),
    field('Next visit', patient.nextVisit ? formatLongDateTime(patient.nextVisit) : 'Not scheduled'),
    field('Care team', patient.careTeam.join('; ') || 'Not assigned'),
    ''
  ]
  if (patient.alert) {
    lines.push(`Follow-up: ${patient.alert.title}`, `  ${patient.alert.detail}`, '')
  }
  lines.push('Current plan')
  if (patient.plan.length === 0) lines.push('  No plan items recorded.')
  patient.plan.forEach((item, index) => lines.push(`  ${index + 1}. ${item}`))
  lines.push('', 'Recent activity')
  if (patient.activity.length === 0) lines.push('  No activity recorded.')
  for (const activity of patient.activity) {
    lines.push(`  - ${formatLongDateTime(activity.at)}  ${activity.title}${activity.detail ? ` — ${activity.detail}` : ''}`)
  }
  lines.push('', `Exported ${formatLongDateTime(exportedAt)} from CareConnect.`, '')
  return lines.join('\n')
}

export function formatPatientSummaryJson(patient: Patient, exportedAt: Date): string {
  return `${JSON.stringify({ format: PATIENT_EXPORT_FORMAT, exportedAt: exportedAt.toISOString(), synthetic: true, patient }, null, 2)}\n`
}

export function formatPatientExport(patient: Patient, format: ExportFormat, exportedAt: Date): string {
  return format === 'json' ? formatPatientSummaryJson(patient, exportedAt) : formatPatientSummaryText(patient, exportedAt)
}
