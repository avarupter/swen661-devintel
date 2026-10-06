import { pluralize } from '../../../../shared/format'
import { useWorkspace } from '../../state/AppStateProvider'
import { useNow } from '../../state/clock'
import { scheduleDays } from './scheduleModel'
import { VisitList } from './VisitList'
import './schedule.css'

/** Visits for the next seven days, one card per day (empty days included). */
export function ScheduleView(): React.JSX.Element {
  const workspace = useWorkspace()
  const now = useNow()
  const days = scheduleDays(workspace.patients, now, 7)

  return (
    <div className="view schedule" data-region="main">
      {days.map((day) => {
        const headingId = `schedule-day-${day.key}`
        return (
          <section key={day.key} className="card schedule-day" aria-labelledby={headingId}>
            <div className="card__header">
              <h2 id={headingId} className="card__title">
                {day.heading}
              </h2>
              <span className="chip chip--neutral">{pluralize(day.visits.length, 'visit')}</span>
            </div>
            {day.visits.length > 0 ? (
              <VisitList visits={day.visits} labelledBy={headingId} />
            ) : (
              <p className="schedule-day__empty">No visits scheduled.</p>
            )}
          </section>
        )
      })}
    </div>
  )
}
