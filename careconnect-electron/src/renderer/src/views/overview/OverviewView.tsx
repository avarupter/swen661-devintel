import { formatDayTime, pluralize, STATUS_LABELS } from '../../../../shared/format'
import type { PatientStatus } from '../../../../shared/model'
import { useAnnounce } from '../../a11y/Announcer'
import { useCommands } from '../../commands/CommandProvider'
import { Icon, type IconName } from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'
import { useAppDispatch, useWorkspace } from '../../state/AppStateProvider'
import { useNow } from '../../state/clock'
import { upcomingVisits } from '../../state/selectors'
import { VisitList } from '../schedule/VisitList'
import { needsAttention, statCards, type StatCard, type StatCardId, statCardName } from './overviewModel'
import './overview.css'

const CARD_ICONS: Record<StatCardId, IconName> = {
  'needs-review': 'exclamation',
  open: 'infoMark',
  completed: 'check',
  unread: 'inbox',
  tasks: 'clipboard'
}

function isStatus(id: StatCardId): id is PatientStatus {
  return id === 'needs-review' || id === 'open' || id === 'completed'
}

/**
 * The day at a glance: stat cards that open the matching list, today's
 * visits, and patients whose care summary carries a follow-up alert.
 */
export function OverviewView(): React.JSX.Element {
  const workspace = useWorkspace()
  const dispatch = useAppDispatch()
  const { run } = useCommands()
  const announce = useAnnounce()
  const now = useNow()

  const cards = statCards(workspace, now)
  const visits = upcomingVisits(workspace.patients, now, 1)
  const attention = needsAttention(workspace.patients)

  const openCard = (card: StatCard): void => {
    if (isStatus(card.id)) {
      // The card promises exactly this many patients, so a leftover search must not hide any.
      dispatch({ type: 'ui/setPatientQuery', query: '' })
      dispatch({ type: 'ui/setStatusFilter', filter: card.id })
      run({ id: 'navigate.patients' })
      announce(`Showing ${STATUS_LABELS[card.id]} patients, ${pluralize(card.count, 'result')}.`)
    } else {
      run({ id: card.id === 'unread' ? 'navigate.inbox' : 'navigate.tasks' })
    }
  }

  return (
    <div className="view overview" data-region="main">
      <section className="overview__glance" aria-labelledby="overview-glance-heading">
        <h2 id="overview-glance-heading" className="view__heading">
          At a glance
        </h2>
        <ul className="stat-grid">
          {cards.map((card) => (
            <li key={card.id}>
              <button type="button" className={`stat-card stat-card--${card.id}`} onClick={() => openCard(card)}>
                {/* One exact spoken name, "Needs review: 8 patients"; the visible parts are hidden from
                    screen readers rather than overridden with aria-label (WCAG 2.5.3). */}
                <span className="visually-hidden">{statCardName(card)}</span>
                <span className="stat-card__label" aria-hidden="true">
                  <span className="stat-card__icon">
                    <Icon name={CARD_ICONS[card.id]} />
                  </span>
                  {card.label}
                </span>
                <span className="stat-card__value" aria-hidden="true">
                  <span className="stat-card__count">{card.count}</span>
                  {card.unit && <span className="stat-card__unit">{card.unit}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="overview__columns">
        <section className="card" aria-labelledby="overview-visits-heading">
          <div className="card__header">
            <h2 id="overview-visits-heading" className="card__title">
              Today’s visits
            </h2>
            <span className="chip chip--neutral">{pluralize(visits.length, 'visit')}</span>
          </div>
          {visits.length > 0 ? (
            <VisitList visits={visits} labelledBy="overview-visits-heading" />
          ) : (
            <p className="overview__empty">No visits today.</p>
          )}
        </section>

        <section className="card" aria-labelledby="overview-attention-heading">
          <div className="card__header">
            <h2 id="overview-attention-heading" className="card__title">
              Needs attention
            </h2>
            <span className="chip chip--neutral">{pluralize(attention.length, 'patient')}</span>
          </div>
          {attention.length > 0 ? (
            <ul className="attention-list" aria-labelledby="overview-attention-heading">
              {attention.map((patient) => (
                <li key={patient.id} className="attention">
                  <Icon name="alert" className="attention__icon" />
                  <div className="attention__text">
                    <button
                      type="button"
                      className="link-button attention__patient"
                      aria-label={`${patient.name}, ${patient.alert?.title ?? ''}`}
                      onClick={() => run({ id: 'patient.open', patientId: patient.id })}
                    >
                      {patient.name}
                    </button>
                    <p className="attention__title">{patient.alert?.title}</p>
                    <p className="attention__detail">{patient.alert?.detail}</p>
                    <p className="attention__meta">{patient.nextVisit ? `Next visit ${formatDayTime(patient.nextVisit, now)}` : 'No visit scheduled'}</p>
                  </div>
                  <StatusChip status={patient.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="overview__empty">No follow-up alerts. Every patient is up to date.</p>
          )}
        </section>
      </div>
    </div>
  )
}
