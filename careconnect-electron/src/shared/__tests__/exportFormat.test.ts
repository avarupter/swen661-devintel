import {
  exportFileName,
  formatPatientExport,
  formatPatientSummaryJson,
  formatPatientSummaryText,
  PATIENT_EXPORT_FORMAT
} from '../exportFormat'
import type { Patient } from '../model'
import { createSeedWorkspace } from '../seed'
import { parsePatientImport } from '../validate'

const NOW = new Date(2026, 9, 5, 9, 42)

function avery(): Patient {
  return createSeedWorkspace(NOW).patients[0]
}

describe('formatPatientSummaryText', () => {
  it('writes the whole summary with absolute dates, including the alert, plan and activity', () => {
    expect(formatPatientSummaryText(avery(), NOW)).toBe(
      [
        'CareConnect — Patient summary',
        'Synthetic demo record. Not real patient data.',
        '',
        'Name:         Avery Park',
        'Pronouns:     they/them',
        'Age group:    Adult',
        'Care ID:      CC-1048',
        'Status:       Needs review',
        'Reason:       Wellness follow-up',
        'Last contact: Wed, Sep 30, 2026, 14:10',
        'Next visit:   Mon, Oct 5, 2026, 10:30',
        'Care team:    Jordan Lee, RN; Dr. Sam Okafor; Robin Hale, PharmD; Chris Vega, MSW',
        '',
        'Follow-up: Follow-up due today',
        '  Review home monitoring notes before the 10:30 check-in.',
        '',
        'Current plan',
        '  1. Confirm symptom trend and energy level',
        '  2. Review adherence to hydration goals',
        '  3. Coordinate next wellness follow-up',
        '',
        'Recent activity',
        '  - Mon, Oct 5, 2026, 09:14  Visit note updated — Home monitoring notes uploaded; evening readings slightly higher than usual.',
        '  - Sun, Oct 4, 2026, 15:22  Portal message — Patient shared this week’s blood pressure readings.',
        '  - Sat, Sep 26, 2026, 11:05  Care task completed — Medication reconciliation completed.',
        '',
        'Exported Mon, Oct 5, 2026, 09:42 from CareConnect.',
        ''
      ].join('\n')
    )
  })

  it('never says "Today", because the file outlives the day it was written', () => {
    expect(formatPatientSummaryText(avery(), NOW)).not.toMatch(/Today|Yesterday|Tomorrow/)
  })

  it('fills in blanks for a sparse record', () => {
    const sparse: Patient = {
      ...avery(),
      pronouns: '',
      ageGroup: '',
      nextVisit: null,
      careTeam: [],
      alert: null,
      plan: [],
      activity: [{ id: 'a-1', kind: 'record', title: 'Patient record created', at: NOW.toISOString() }]
    }
    const text = formatPatientSummaryText(sparse, NOW)
    expect(text).toContain('Pronouns:     Not recorded\n')
    expect(text).toContain('Age group:    Not recorded\n')
    expect(text).toContain('Next visit:   Not scheduled\n')
    expect(text).toContain('Care team:    Not assigned\n')
    expect(text).not.toContain('Follow-up:')
    expect(text).toContain('Current plan\n  No plan items recorded.\n')
    expect(text).toContain('  - Mon, Oct 5, 2026, 09:42  Patient record created\n')
    expect(formatPatientSummaryText({ ...sparse, activity: [] }, NOW)).toContain('Recent activity\n  No activity recorded.\n')
  })
})

describe('formatPatientSummaryJson', () => {
  it('wraps the record in a versioned, clearly synthetic envelope', () => {
    const json = formatPatientSummaryJson(avery(), NOW)
    expect(json.endsWith('}\n')).toBe(true)
    expect(JSON.parse(json)).toEqual({ format: PATIENT_EXPORT_FORMAT, exportedAt: NOW.toISOString(), synthetic: true, patient: avery() })
    expect(PATIENT_EXPORT_FORMAT).toBe('careconnect.patient.v1')
  })

  it('round-trips through the importer unchanged', () => {
    expect(parsePatientImport(formatPatientSummaryJson(avery(), NOW))).toEqual({ patients: [avery()], skipped: 0 })
  })
})

describe('formatPatientExport', () => {
  it('chooses the writer by format', () => {
    expect(formatPatientExport(avery(), 'txt', NOW)).toBe(formatPatientSummaryText(avery(), NOW))
    expect(formatPatientExport(avery(), 'json', NOW)).toBe(formatPatientSummaryJson(avery(), NOW))
  })
})

describe('exportFileName', () => {
  it('names the file after the Care ID and a slug of the name', () => {
    expect(exportFileName(avery(), 'txt')).toBe('CC-1048-avery-park.txt')
    expect(exportFileName(avery(), 'json')).toBe('CC-1048-avery-park.json')
  })

  it('slugs punctuation, accents and spacing', () => {
    expect(exportFileName({ ...avery(), name: "  Dr. Sam O'Okafor  " }, 'txt')).toBe('CC-1048-dr-sam-o-okafor.txt')
    expect(exportFileName({ ...avery(), name: 'Zoë Ångström' }, 'txt')).toBe('CC-1048-zo-ngstr-m.txt')
    expect(exportFileName({ ...avery(), name: '***' }, 'txt')).toBe('CC-1048-patient.txt')
  })

  it.each([
    ['../../Startup/evil', 'Avery Park'],
    ['..\\..\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\x', 'Avery Park'],
    ['C:\\Windows\\System32', 'Avery Park'],
    ['CC:1048*?"<>|', '../../etc/passwd'],
    ['/', 'Avery Park']
  ])('keeps an untrusted Care ID (%j) from steering the save dialog to another folder', (careId, name) => {
    // Imported files are untrusted: validation only checks that the Care ID is non-empty text.
    const fileName = exportFileName({ ...avery(), careId, name }, 'txt')
    expect(fileName).toMatch(/^[A-Za-z0-9][A-Za-z0-9-]*\.txt$/)
    expect(fileName).not.toContain('..')
  })
})
