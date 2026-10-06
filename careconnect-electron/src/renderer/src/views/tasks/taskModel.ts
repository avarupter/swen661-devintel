/** Task grouping and due-date wording for the Tasks view. Pure, so every rule is unit tested. */
import { calendarDayOffset, formatTime, formatWeekdayDate } from '../../../../shared/format'
import type { CareTask } from '../../../../shared/model'
import { isOverdue } from '../../state/selectors'

export type TaskGroupId = 'overdue' | 'today' | 'upcoming' | 'completed'

export interface TaskGroup {
  id: TaskGroupId
  title: string
  /** Shown in place of the list when the group is empty. */
  emptyText: string
  tasks: CareTask[]
}

const byDue = (a: CareTask, b: CareTask): number => a.due.localeCompare(b.due)

/**
 * Disjoint groups: anything unfinished whose due time has passed is Overdue,
 * the rest of today is Due today, later days are Upcoming, and finished tasks
 * are Completed (listed only when the toolbar asks for them).
 */
export function groupTasks(tasks: readonly CareTask[], now: Date, showCompleted: boolean): TaskGroup[] {
  const overdue = tasks.filter((task) => isOverdue(task, now)).sort(byDue)
  const open = tasks.filter((task) => !task.done && !isOverdue(task, now))
  const groups: TaskGroup[] = [
    { id: 'overdue', title: 'Overdue', emptyText: 'Nothing is overdue.', tasks: overdue },
    {
      id: 'today',
      title: 'Due today',
      emptyText: 'Nothing else is due today.',
      tasks: open.filter((task) => calendarDayOffset(task.due, now) <= 0).sort(byDue)
    },
    { id: 'upcoming', title: 'Upcoming', emptyText: 'No upcoming tasks.', tasks: open.filter((task) => calendarDayOffset(task.due, now) > 0).sort(byDue) }
  ]
  if (showCompleted) {
    groups.push({
      id: 'completed',
      title: 'Completed',
      emptyText: 'No completed tasks yet.',
      tasks: tasks.filter((task) => task.done).sort((a, b) => byDue(b, a))
    })
  }
  return groups
}

function dayPhrase(due: string, now: Date): string {
  const offset = calendarDayOffset(due, now)
  if (offset === 0) return 'today'
  if (offset === 1) return 'tomorrow'
  if (offset === -1) return 'yesterday'
  return formatWeekdayDate(due, now)
}

/** "Due today at 10:00", "Due Thu, Oct 8 at 15:00", "Overdue: was due yesterday at 17:30". */
export function taskDueText(task: CareTask, now: Date): string {
  const when = `${dayPhrase(task.due, now)} at ${formatTime(task.due)}`
  return isOverdue(task, now) ? `Overdue: was due ${when}` : `Due ${when}`
}
