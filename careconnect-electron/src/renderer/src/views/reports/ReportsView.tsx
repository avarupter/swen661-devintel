import { pluralize } from '../../../../shared/format'
import { Icon } from '../../components/Icon'
import { StatusChip } from '../../components/StatusChip'
import { useWorkspace } from '../../state/AppStateProvider'
import { useNow } from '../../state/clock'
import { statusRows, topReasons, visitRows } from './reportModel'
import './reports.css'

const TOP_REASON_COUNT = 5

/** A decorative bar beside a number. Hidden from assistive technology: the table cell is the data. */
function Bar({ percent }: { percent: number }): React.JSX.Element {
  return (
    <span className="report-bar" aria-hidden="true">
      <span className="report-bar__fill" style={{ width: `${percent}%` }} />
    </span>
  )
}

/** Caseload reports as accessible tables (caption, column and row headers), with optional bars. */
export function ReportsView(): React.JSX.Element {
  const workspace = useWorkspace()
  const now = useNow()
  const status = statusRows(workspace.patients)
  const days = visitRows(workspace.patients, now)
  const totalVisits = days.reduce((sum, day) => sum + day.count, 0)
  const busiestDay = Math.max(0, ...days.map((day) => day.count))
  const reasons = topReasons(workspace.patients, TOP_REASON_COUNT)

  return (
    <div className="view reports" data-region="main">
      <section className="card report" aria-labelledby="report-status-heading">
        <div className="card__header">
          <h2 id="report-status-heading" className="card__title">
            Patients by status
          </h2>
          <span className="chip chip--neutral">{pluralize(status.total, 'patient')}</span>
        </div>
        <table className="data-table report-table">
          <caption className="visually-hidden">Patients by status: count and share of {pluralize(status.total, 'patient')}</caption>
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col" className="numeric">
                Patients
              </th>
              <th scope="col" className="numeric">
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {status.rows.map((row) => (
              <tr key={row.status}>
                <th scope="row">
                  <StatusChip status={row.status} />
                </th>
                <td className="numeric">{row.count}</td>
                <td className="numeric">
                  <span className="report-share">
                    <Bar percent={row.percent} />
                    {row.percent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td className="numeric">{status.total}</td>
              <td className="numeric">{status.total > 0 ? '100%' : '0%'}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="card report report--tall" aria-labelledby="report-visits-heading">
        <div className="card__header">
          <h2 id="report-visits-heading" className="card__title">
            Visits in the next 7 days
          </h2>
          <span className="chip chip--neutral">{pluralize(totalVisits, 'visit')}</span>
        </div>
        <table className="data-table report-table">
          <caption className="visually-hidden">Visits in the next 7 days, by day</caption>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col" className="numeric">
                Visits
              </th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.key}>
                <th scope="row">{day.heading}</th>
                <td className="numeric">
                  <span className="report-share">
                    <Bar percent={busiestDay === 0 ? 0 : Math.round((day.count / busiestDay) * 100)} />
                    {day.count}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td className="numeric">{totalVisits}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="card report" aria-labelledby="report-reasons-heading">
        <div className="card__header">
          <h2 id="report-reasons-heading" className="card__title">
            Top reasons for care
          </h2>
        </div>
        {reasons.length === 0 ? (
          <p className="report__empty">No reasons recorded yet.</p>
        ) : (
          <table className="data-table report-table">
            <caption className="visually-hidden">Top {TOP_REASON_COUNT} reasons for care, by number of patients</caption>
            <thead>
              <tr>
                <th scope="col">Reason</th>
                <th scope="col" className="numeric">
                  Patients
                </th>
                <th scope="col" className="numeric">
                  Share
                </th>
              </tr>
            </thead>
            <tbody>
              {reasons.map((row) => (
                <tr key={row.reason}>
                  <th scope="row">{row.reason}</th>
                  <td className="numeric">{row.count}</td>
                  <td className="numeric">
                    <span className="report-share">
                      <Bar percent={row.percent} />
                      {row.percent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="reports__note">
        <Icon name="info" />
        All figures come from synthetic demo data. Percentages are rounded, so they may not add up to exactly 100%.
      </p>
    </div>
  )
}
