import { Fragment, useEffect, useRef, useState } from 'react'
import { formatActivityTime, formatDayTime, formatRelativeDay, pluralize } from '../../../../shared/format'
import type { ActivityKind, Patient } from '../../../../shared/model'
import { ariaKeyShortcuts } from '../../../../shared/shortcuts'
import { useCommands } from '../../commands/CommandProvider'
import { Avatar } from '../../components/Avatar'
import { Icon, type IconName } from '../../components/Icon'
import { KeyHint } from '../../components/KeyHint'
import { Toolbar, ToolbarButton } from '../../components/Toolbar'
import { useAppState } from '../../state/AppStateProvider'
import { PATIENT_NAME_HEADING_ID } from './PatientList'
import { menuPosition, type MenuPosition } from './patientMenus'

export const MORE_BUTTON_ID = 'patient-action-more'

const ACTIVITY_ICONS: Record<ActivityKind, IconName> = {
  note: 'file',
  message: 'message',
  task: 'checkCircle',
  visit: 'calendar',
  record: 'clipboard'
}

/** "Care team: 4 members" as a disclosure that reveals the names. */
function CareTeamStat({ patientId, team }: { patientId: string; team: string[] }): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const listId = `care-team-${patientId}`
  return (
    <div className="patient-stat">
      <dt className="section-label">Care team</dt>
      <dd className="patient-stat__value">
        <button type="button" className="patient-stat__toggle" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(!expanded)}>
          <span>{pluralize(team.length, 'member')}</span>
          <span className="visually-hidden"> in the care team</span>
          <Icon name={expanded ? 'arrowUp' : 'arrowDown'} />
        </button>
        <ul id={listId} className="patient-stat__team" hidden={!expanded}>
          {team.map((member, index) => (
            <li key={`${index}-${member}`}>{member}</li>
          ))}
        </ul>
      </dd>
    </div>
  )
}

export interface PatientDetailProps {
  patient: Patient | null
  now: Date
  onShowMenu(patient: Patient, position: MenuPosition): Promise<void>
}

/**
 * The detail pane (design image 1): header and actions, stat cards, the care
 * summary and the "Recent activity" complementary landmark.
 *
 * The pane is a named group (the F6 "detail" region), not a region landmark:
 * "Recent activity" must not sit inside another landmark (axe
 * landmark-complementary-is-top-level), and spec card 03's landmark list has
 * no detail-pane landmark.
 */
export function PatientDetail({ patient, now, onShowMenu }: PatientDetailProps): React.JSX.Element {
  const { ui } = useAppState()
  const { run } = useCommands()
  const sectionRef = useRef<HTMLElement>(null)

  // Shift+F10, the Menu key or a right-click anywhere in the pane opens the
  // patient's context menu, matching the "More  Shift+F10" hint.
  const latest = useRef({ patient, onShowMenu })
  useEffect(() => {
    latest.current = { patient, onShowMenu }
  })
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const onContextMenu = (event: MouseEvent): void => {
      const { patient: current, onShowMenu: show } = latest.current
      if (!current) return
      event.preventDefault()
      void show(current, menuPosition(event.target instanceof Element ? event.target : section, event))
    }
    section.addEventListener('contextmenu', onContextMenu)
    return () => section.removeEventListener('contextmenu', onContextMenu)
  }, [])

  if (!patient) {
    return (
      <section ref={sectionRef} role="group" className="patient-detail" data-region="detail" aria-labelledby={PATIENT_NAME_HEADING_ID}>
        <h2 id={PATIENT_NAME_HEADING_ID} className="visually-hidden" tabIndex={-1}>
          Patient details
        </h2>
        <p className="empty-state patient-detail__empty">Select a patient to see their care summary.</p>
      </section>
    )
  }

  const meta = [patient.ageGroup, patient.pronouns, `Care ID ${patient.careId}`].filter(Boolean)
  const runForPatient = (id: 'patient.message' | 'patient.editSummary' | 'patient.addNote'): void => run({ id, patientId: patient.id })

  return (
    <section ref={sectionRef} role="group" className="patient-detail" data-region="detail" aria-labelledby={PATIENT_NAME_HEADING_ID}>
      <div className="patient-detail__header">
        <Avatar name={patient.name} size="large" tone="brand" />
        <div className="patient-detail__identity">
          <div className="patient-detail__name-row">
            <h2 id={PATIENT_NAME_HEADING_ID} className="patient-detail__name" tabIndex={-1}>
              {patient.name}
            </h2>
            <span className="chip chip--neutral">Synthetic demo record</span>
          </div>
          {/* Each part wraps as a unit, so a narrow header never splits "Care ID CC-1048" at its hyphen. */}
          <p className="patient-detail__meta">
            {meta.map((part, index) => (
              <Fragment key={`${index}-${part}`}>
                {index > 0 && ' · '}
                <span className="patient-detail__meta-part">{part}</span>
              </Fragment>
            ))}
          </p>
        </div>
        <Toolbar label={`Actions for ${patient.name}`} className="patient-detail__actions">
          <ToolbarButton id="patient-action-message" command="patient.message" label={`Message ${patient.name}`} icon="message" onClick={() => runForPatient('patient.message')}>
            Message
          </ToolbarButton>
          <ToolbarButton
            id={MORE_BUTTON_ID}
            command="patient.contextMenu"
            label={`More actions for ${patient.name}`}
            icon="more"
            hasPopup="menu"
            onClick={() => void onShowMenu(patient, menuPosition(document.getElementById(MORE_BUTTON_ID)))}
          >
            More
          </ToolbarButton>
        </Toolbar>
      </div>

      <dl className="patient-stats">
        <div className="patient-stat">
          <dt className="section-label">Last contact</dt>
          <dd className="patient-stat__value">{formatRelativeDay(patient.lastContact, now)}</dd>
        </div>
        <div className="patient-stat">
          <dt className="section-label">Next visit</dt>
          <dd className="patient-stat__value">{patient.nextVisit ? formatDayTime(patient.nextVisit, now) : 'Not scheduled'}</dd>
        </div>
        <CareTeamStat key={patient.id} patientId={patient.id} team={patient.careTeam} />
      </dl>

      <div className="patient-detail__columns">
        <section className="card patient-card patient-summary" aria-labelledby="care-summary-heading">
          <div className="card__header">
            <h3 id="care-summary-heading" className="card__title">
              Care summary
            </h3>
            <button
              type="button"
              className="link-button"
              aria-label={`Edit care summary for ${patient.name}`}
              aria-keyshortcuts={ariaKeyShortcuts('patient.editSummary', ui.platform)}
              onClick={() => runForPatient('patient.editSummary')}
            >
              Edit <KeyHint command="patient.editSummary" />
            </button>
          </div>
          {patient.alert && (
            <div className="callout callout--warning">
              <Icon name="alert" />
              <p className="callout__title">
                <span className="visually-hidden">Follow-up alert: </span>
                <span>{patient.alert.title}</span>
              </p>
              {patient.alert.detail && <p className="callout__detail">{patient.alert.detail}</p>}
            </div>
          )}
          <h4 className="section-label">Current plan</h4>
          {patient.plan.length > 0 ? (
            <ul className="patient-summary__plan">
              {patient.plan.map((item, index) => (
                <li key={`${index}-${item}`}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No plan items yet.</p>
          )}
        </section>

        <aside className="card patient-card patient-activity" aria-labelledby="recent-activity-heading">
          <h3 id="recent-activity-heading" className="card__title">
            Recent activity
          </h3>
          {patient.activity.length > 0 ? (
            <ol className="patient-activity__list">
              {patient.activity.map((activity) => (
                <li key={activity.id} className="patient-activity__item">
                  <span className="patient-activity__icon">
                    <Icon name={ACTIVITY_ICONS[activity.kind]} />
                  </span>
                  <span className="patient-activity__text">
                    <span className="patient-activity__title">{activity.title}</span>
                    <time className="patient-activity__time" dateTime={activity.at}>
                      {formatActivityTime(activity.at, now)}
                    </time>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">No activity yet.</p>
          )}
          <div className="patient-activity__footer">
            {/* The name starts with the visible "Add note" so speech input can reach it (WCAG 2.5.3), then names the patient (spec card 05). */}
            <button
              type="button"
              className="button patient-activity__add"
              aria-label={`Add note for ${patient.name}`}
              aria-keyshortcuts={ariaKeyShortcuts('patient.addNote', ui.platform)}
              onClick={() => runForPatient('patient.addNote')}
            >
              <Icon name="plus" />
              <span className="patient-activity__add-label">Add note</span>
              <KeyHint command="patient.addNote" variant="keys" />
            </button>
          </div>
        </aside>
      </div>
    </section>
  )
}
