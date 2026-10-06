import { flushSync } from 'react-dom'
import { pluralize } from '../../../../shared/format'
import type { CareTask } from '../../../../shared/model'
import { useCommands } from '../../commands/CommandProvider'
import { Icon } from '../../components/Icon'
import { useAppDispatch, useAppState, useStatus, useWorkspace } from '../../state/AppStateProvider'
import { useNow } from '../../state/clock'
import { isOverdue, patientById } from '../../state/selectors'
import { groupTasks, taskDueText, type TaskGroup, type TaskGroupId } from './taskModel'
import './tasks.css'

function taskInputId(taskId: string): string {
  return `task-${taskId}`
}

function groupHeadingId(groupId: TaskGroupId): string {
  return `task-group-${groupId}`
}

/**
 * Tasks as native checkboxes, grouped Overdue, Due today, Upcoming and
 * (when shown) Completed. Ticking a task moves it to another group, so focus
 * stays where the user was working: the next task, else the previous one,
 * else the group heading (spec card 01).
 */
export function TasksView(): React.JSX.Element {
  const workspace = useWorkspace()
  const { ui } = useAppState()
  const dispatch = useAppDispatch()
  const { run } = useCommands()
  const setStatus = useStatus()
  const now = useNow()

  const groups = groupTasks(workspace.tasks, now, ui.showCompletedTasks)
  const hiddenCompleted = ui.showCompletedTasks ? 0 : workspace.tasks.filter((task) => task.done).length

  const toggle = (task: CareTask, group: TaskGroup): void => {
    const index = group.tasks.findIndex((entry) => entry.id === task.id)
    const neighbour = group.tasks[index + 1] ?? group.tasks[index - 1] ?? null
    flushSync(() => dispatch({ type: 'task/toggled', taskId: task.id }))
    document.getElementById(neighbour ? taskInputId(neighbour.id) : groupHeadingId(group.id))?.focus()
    setStatus(task.done ? 'Task reopened.' : 'Task marked done.')
  }

  // The button removes itself once Completed is shown, so focus moves on to the heading it revealed.
  const showCompleted = (): void => {
    flushSync(() => dispatch({ type: 'ui/setShowCompletedTasks', show: true }))
    document.getElementById(groupHeadingId('completed'))?.focus()
  }

  return (
    <div className="view tasks" data-region="main">
      {groups.map((group) => {
        const headingId = groupHeadingId(group.id)
        return (
          <section key={group.id} className={`card task-group task-group--${group.id}`} aria-labelledby={headingId}>
            <div className="card__header">
              <h2 id={headingId} className="card__title" tabIndex={-1}>
                {group.title}
              </h2>
              <span className="chip chip--neutral">{pluralize(group.tasks.length, 'task')}</span>
            </div>
            {group.tasks.length === 0 ? (
              <p className="task-group__empty">{group.emptyText}</p>
            ) : (
              <ul className="task-list" aria-labelledby={headingId}>
                {group.tasks.map((task) => {
                  const inputId = taskInputId(task.id)
                  const dueId = `${inputId}-due`
                  const urgentId = `${inputId}-urgent`
                  const urgent = task.priority === 'urgent'
                  const patient = patientById(workspace, task.patientId)
                  return (
                    <li key={task.id} className={`task${task.done ? ' task--done' : ''}`}>
                      {/* The whole label, box and title together, is the click target (at least 32 px, spec card 06). */}
                      <label htmlFor={inputId} className="task__main">
                        <input
                          type="checkbox"
                          id={inputId}
                          className="task__checkbox"
                          checked={task.done}
                          aria-describedby={urgent ? `${dueId} ${urgentId}` : dueId}
                          onChange={() => toggle(task, group)}
                        />
                        <span className="task__title">{task.title}</span>
                      </label>
                      <div className="task__meta">
                        <span id={dueId} className={`task__due${isOverdue(task, now) ? ' task__due--overdue' : ''}`}>
                          {taskDueText(task, now)}
                        </span>
                        {urgent && (
                          <span id={urgentId} className="chip chip--urgent">
                            <Icon name="exclamation" className="chip__icon" />
                            Urgent
                          </span>
                        )}
                        {patient && (
                          // Named for the task too, so one patient's tasks never give identical buttons (spec card 05);
                          // the name starts with the visible text (label in name).
                          <button
                            type="button"
                            className="link-button task__patient"
                            aria-label={`${patient.name}, ${task.title}`}
                            onClick={() => run({ id: 'patient.open', patientId: patient.id })}
                          >
                            <Icon name="users" />
                            {patient.name}
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}

      {hiddenCompleted > 0 && (
        <p className="tasks__hidden">
          {pluralize(hiddenCompleted, 'completed task')} {hiddenCompleted === 1 ? 'is' : 'are'} hidden.{' '}
          <button type="button" className="link-button" onClick={showCompleted}>
            Show {pluralize(hiddenCompleted, 'completed task')}
          </button>
        </p>
      )}
    </div>
  )
}
