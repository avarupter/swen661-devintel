import type { CareTask } from '../../../../../shared/model'
import { createSeedWorkspace } from '../../../../../shared/seed'
import { groupTasks, taskDueText } from '../taskModel'

const NOW = new Date(2026, 9, 5, 9, 42)

function task(id: string, due: Date, overrides: Partial<CareTask> = {}): CareTask {
  return { id, title: id, patientId: null, due: due.toISOString(), done: false, priority: 'routine', ...overrides }
}

describe('groupTasks', () => {
  it('splits the seed tasks into Overdue, Due today and Upcoming, leaving Completed out unless asked', () => {
    const tasks = createSeedWorkspace(NOW).tasks
    const groups = groupTasks(tasks, NOW, false)
    expect(groups.map((group) => [group.id, group.title, group.tasks.map((entry) => entry.id)])).toEqual([
      ['overdue', 'Overdue', []],
      ['today', 'Due today', ['t-1', 't-2', 't-3', 't-4']],
      ['upcoming', 'Upcoming', ['t-5', 't-6', 't-7']]
    ])
    expect(groupTasks(tasks, NOW, true).map((group) => group.id)).toEqual(['overdue', 'today', 'upcoming', 'completed'])
    expect(groupTasks(tasks, NOW, true)[3].tasks.map((entry) => entry.id)).toEqual(['t-8'])
  })

  it('puts every task in exactly one group, oldest due first (completed: most recent first)', () => {
    const tasks = [
      task('later-today', new Date(2026, 9, 5, 15, 0)),
      task('earlier-today-passed', new Date(2026, 9, 5, 8, 0)),
      task('last-week', new Date(2026, 8, 28, 9, 0)),
      task('tomorrow', new Date(2026, 9, 6, 9, 0)),
      task('done-old', new Date(2026, 8, 1, 9, 0), { done: true }),
      task('done-recent', new Date(2026, 9, 4, 9, 0), { done: true }),
      task('done-future', new Date(2026, 9, 9, 9, 0), { done: true })
    ]
    const groups = Object.fromEntries(groupTasks(tasks, NOW, true).map((group) => [group.id, group.tasks.map((entry) => entry.id)]))
    expect(groups).toEqual({
      overdue: ['last-week', 'earlier-today-passed'],
      today: ['later-today'],
      upcoming: ['tomorrow'],
      completed: ['done-future', 'done-recent', 'done-old']
    })
  })

  it('gives every group an empty-state sentence', () => {
    for (const group of groupTasks([], NOW, true)) expect(group.emptyText).toMatch(/\.$/)
  })
})

describe('taskDueText', () => {
  it('says when a task is due, in words', () => {
    expect(taskDueText(task('a', new Date(2026, 9, 5, 10, 0)), NOW)).toBe('Due today at 10:00')
    expect(taskDueText(task('b', new Date(2026, 9, 6, 9, 0)), NOW)).toBe('Due tomorrow at 09:00')
    expect(taskDueText(task('c', new Date(2026, 9, 8, 15, 0)), NOW)).toBe('Due Thu, Oct 8 at 15:00')
  })

  it('flags overdue tasks, and not finished ones', () => {
    expect(taskDueText(task('d', new Date(2026, 9, 5, 8, 0)), NOW)).toBe('Overdue: was due today at 08:00')
    expect(taskDueText(task('e', new Date(2026, 9, 4, 17, 30)), NOW)).toBe('Overdue: was due yesterday at 17:30')
    expect(taskDueText(task('f', new Date(2026, 8, 26, 11, 5), { done: true }), NOW)).toBe('Due Sat, Sep 26 at 11:05')
  })
})
