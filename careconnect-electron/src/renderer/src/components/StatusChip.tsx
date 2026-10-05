import { STATUS_LABELS } from '../../../shared/format'
import type { PatientStatus } from '../../../shared/model'
import { Icon, type IconName } from './Icon'

const STATUS_ICONS: Record<PatientStatus, IconName> = {
  'needs-review': 'exclamation',
  open: 'infoMark',
  completed: 'check'
}

/** Status is never colour alone: every chip pairs colour with an icon and a word (spec card 08). */
export function StatusChip({ status }: { status: PatientStatus }): React.JSX.Element {
  return (
    <span className={`chip chip--${status}`}>
      <Icon name={STATUS_ICONS[status]} className="chip__icon" />
      {STATUS_LABELS[status]}
    </span>
  )
}
