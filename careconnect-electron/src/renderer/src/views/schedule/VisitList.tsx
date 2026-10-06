import { formatTime } from '../../../../shared/format'
import type { Patient } from '../../../../shared/model'
import { useCommands } from '../../commands/CommandProvider'
import { StatusChip } from '../../components/StatusChip'
import './visits.css'

/**
 * Visits in time order: time, patient (a button that opens the record),
 * reason and status. Shared by Schedule and Overview. Each button names the
 * visit as well as the patient, so the same patient listed in two places
 * never yields two identical "Avery Park" buttons (spec card 05).
 */
export function VisitList({ visits, labelledBy }: { visits: readonly Patient[]; labelledBy: string }): React.JSX.Element {
  const { run } = useCommands()
  return (
    <ol className="visit-list" aria-labelledby={labelledBy}>
      {visits.map((patient) => {
        const at = patient.nextVisit ?? ''
        const time = formatTime(at)
        return (
          <li key={patient.id} className="visit">
            <time className="visit__time" dateTime={at}>
              {time}
            </time>
            <span className="visit__who">
              <button
                type="button"
                className="link-button visit__patient"
                aria-label={`${patient.name}, visit at ${time}`}
                onClick={() => run({ id: 'patient.open', patientId: patient.id })}
              >
                {patient.name}
              </button>
              <span className="visit__reason">{patient.reason}</span>
            </span>
            <StatusChip status={patient.status} />
          </li>
        )
      })}
    </ol>
  )
}
