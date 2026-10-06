import { useEffect, useMemo, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { STATUS_LABELS } from '../../../../shared/format'
import type { Patient } from '../../../../shared/model'
import { ariaKeyShortcuts } from '../../../../shared/shortcuts'
import { useAnnounce } from '../../a11y/Announcer'
import { useSearchTarget } from '../../commands/CommandProvider'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { KeyHint } from '../../components/KeyHint'
import { StatusChip } from '../../components/StatusChip'
import { useAppDispatch, useAppState, useWorkspace } from '../../state/AppStateProvider'
import { useClock } from '../../state/clock'
import { patientSecondaryText, visiblePatients } from '../../state/selectors'
import { filterAnnouncement, menuPosition, patientOptionId, patientOptionName, resultCountLabel, type MenuPosition } from './patientMenus'

/** The result count is announced once typing pauses for this long. */
export const SEARCH_ANNOUNCE_DELAY_MS = 400

/** PageUp and PageDown move this many rows. */
const PAGE_SIZE = 10

export const PATIENT_SEARCH_ID = 'patient-search'
export const PATIENT_NAME_HEADING_ID = 'patient-name-heading'
const HEADING_ID = 'patient-list-heading'

function focusById(id: string): void {
  document.getElementById(id)?.focus()
}

interface PatientOptionProps {
  patient: Patient
  now: Date
  selected: boolean
  tabbable: boolean
  onFocus(): void
  onClick(): void
  onKeyDown(event: KeyboardEvent<HTMLDivElement>): void
  onContextMenu(event: MouseEvent<HTMLDivElement>): void
}

function PatientOption({ patient, now, selected, tabbable, onFocus, onClick, onKeyDown, onContextMenu }: PatientOptionProps): React.JSX.Element {
  return (
    <div
      role="option"
      id={patientOptionId(patient.id)}
      aria-selected={selected}
      aria-label={patientOptionName(patient, now)}
      tabIndex={tabbable ? 0 : -1}
      className={`patient-option focus-inset${selected ? ' patient-option--selected' : ''}`}
      onFocus={onFocus}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
    >
      <Avatar name={patient.name} tone={selected ? 'brand' : 'neutral'} />
      <span className="patient-option__text">
        <span className="patient-option__name">{patient.name}</span>
        <span className="patient-option__secondary">{patientSecondaryText(patient, now)}</span>
      </span>
      <StatusChip status={patient.status} />
    </div>
  )
}

export interface PatientListProps {
  now: Date
  onShowMenu(patient: Patient, position: MenuPosition): Promise<void>
}

/**
 * The list pane (design image 1): "Recent patients", the search landmark and
 * a single-select listbox where selection follows focus (spec cards 04, 05).
 */
export function PatientList({ now, onShowMenu }: PatientListProps): React.JSX.Element {
  const { ui } = useAppState()
  const workspace = useWorkspace()
  const dispatch = useAppDispatch()
  const clock = useClock()
  const announce = useAnnounce()
  const searchTarget = useSearchTarget()

  const { patientQuery: query, statusFilter: filter, sortOrder, selectedPatientId: selectedId } = ui
  const allPatients = workspace.patients
  const patients = useMemo(() => visiblePatients(allPatients, { query, filter, sortOrder }), [allPatients, query, filter, sortOrder])
  const count = patients.length
  // The one Tab stop: the selected patient, or the first row when the selection is filtered out.
  const activeId = patients.some((patient) => patient.id === selectedId) ? selectedId : (patients[0]?.id ?? null)

  // Selection follows focus. Focus, click and the context menu can all report the
  // same row in one gesture, so remember what was last dispatched.
  const selectedRef = useRef(selectedId)
  useEffect(() => {
    selectedRef.current = selectedId
  }, [selectedId])
  const select = (patient: Patient): void => {
    if (selectedRef.current === patient.id) return
    selectedRef.current = patient.id
    dispatch({ type: 'ui/selectPatient', patientId: patient.id, at: clock().toISOString() })
  }

  // If the focused row disappears (its status changed under a filter), keep focus in the list.
  const focusedRef = useRef<{ id: string; index: number } | null>(null)
  useEffect(() => {
    const last = focusedRef.current
    if (!last || patients.some((patient) => patient.id === last.id)) return
    focusedRef.current = null
    const active = document.activeElement
    if (active && active !== document.body) return
    const next = patients[Math.min(last.index, patients.length - 1)]
    focusById(next ? patientOptionId(next.id) : PATIENT_SEARCH_ID)
  }, [patients])

  // Announce the result count once typing pauses, never on first render.
  const typedRef = useRef(false)
  useEffect(() => {
    if (!typedRef.current) return
    const timer = setTimeout(() => {
      typedRef.current = false
      announce(resultCountLabel(count))
    }, SEARCH_ANNOUNCE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query, count, announce])

  const setQuery = (value: string): void => {
    typedRef.current = true
    dispatch({ type: 'ui/setPatientQuery', query: value })
  }

  const clearSearch = (): void => {
    setQuery('')
    focusById(PATIENT_SEARCH_ID)
  }

  const clearFilter = (): void => {
    dispatch({ type: 'ui/setStatusFilter', filter: 'all' })
    announce(filterAnnouncement('all', visiblePatients(allPatients, { query, filter: 'all', sortOrder }).length))
    // The button removes itself; keep focus nearby.
    focusById(PATIENT_SEARCH_ID)
  }

  const focusActiveOption = (): boolean => {
    if (!activeId) return false
    focusById(patientOptionId(activeId))
    return true
  }

  const onSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (event.key === 'Escape') {
      if (query) {
        event.preventDefault()
        setQuery('')
      } else if (focusActiveOption()) {
        event.preventDefault()
      }
    } else if (event.key === 'ArrowDown' && focusActiveOption()) {
      event.preventDefault()
    }
  }

  const onOptionKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const last = patients.length - 1
    let next: number
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(index + 1, last)
        break
      case 'ArrowUp':
        next = Math.max(index - 1, 0)
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = last
        break
      case 'PageDown':
        next = Math.min(index + PAGE_SIZE, last)
        break
      case 'PageUp':
        next = Math.max(index - PAGE_SIZE, 0)
        break
      case 'Enter':
        event.preventDefault()
        focusById(PATIENT_NAME_HEADING_ID)
        return
      case ' ':
        // Space (and Shift+Space) would scroll the overflow list by a page and leave the
        // focused row out of view. In this single-select listbox it just selects the row.
        event.preventDefault()
        select(patients[index])
        return
      default:
        // No type-ahead: single letters are workspace shortcuts (E, N, M, G…).
        return
    }
    event.preventDefault()
    focusById(patientOptionId(patients[next].id))
  }

  const onOptionContextMenu = (event: MouseEvent<HTMLDivElement>, patient: Patient): void => {
    event.preventDefault()
    const row = event.currentTarget
    const position = menuPosition(row, event)
    if (document.activeElement !== row) row.focus()
    select(patient)
    void onShowMenu(patient, position)
  }

  return (
    <section id="patient-list" className="patient-list" data-region="list" aria-labelledby={HEADING_ID}>
      <div className="patient-list__header">
        <div className="patient-list__title-row">
          <h2 id={HEADING_ID} className="patient-list__title">
            Recent patients
          </h2>
          <span className="patient-list__count">{resultCountLabel(count)}</span>
        </div>
        <div role="search" aria-label="Patient list" className="patient-search">
          <label htmlFor={PATIENT_SEARCH_ID} className="visually-hidden">
            Search list
          </label>
          <Icon name="search" className="patient-search__icon" />
          <input
            ref={searchTarget}
            id={PATIENT_SEARCH_ID}
            className="input patient-search__input"
            type="search"
            placeholder="Search list"
            autoComplete="off"
            spellCheck={false}
            value={query}
            aria-keyshortcuts={`${ariaKeyShortcuts('patient.search', ui.platform) ?? ''} /`.trim()}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onSearchKeyDown}
          />
          <KeyHint keys={['/']} variant="keys" />
        </div>
        {filter !== 'all' && (
          <p className="patient-list__filter">
            <span>Showing: {STATUS_LABELS[filter]}</span>
            <button type="button" className="link-button" onClick={clearFilter}>
              Clear filter
            </button>
          </p>
        )}
      </div>

      {count > 0 ? (
        <div role="listbox" aria-label="Recent patients" className="patient-listbox">
          {patients.map((patient, index) => (
            <PatientOption
              key={patient.id}
              patient={patient}
              now={now}
              selected={patient.id === selectedId}
              tabbable={patient.id === activeId}
              onFocus={() => {
                focusedRef.current = { id: patient.id, index }
                select(patient)
              }}
              onClick={() => select(patient)}
              onKeyDown={(event) => onOptionKeyDown(event, index)}
              onContextMenu={(event) => onOptionContextMenu(event, patient)}
            />
          ))}
        </div>
      ) : (
        <div className="patient-list__empty empty-state">
          {allPatients.length === 0 ? (
            <p>No patients yet.</p>
          ) : query.trim() ? (
            <>
              <p>No patients match “{query}”.</p>
              <button type="button" className="button button--small" onClick={clearSearch}>
                Clear search
              </button>
            </>
          ) : (
            <p>No patients are marked {filter === 'all' ? 'with this status' : STATUS_LABELS[filter].toLowerCase()}.</p>
          )}
        </div>
      )}
    </section>
  )
}
