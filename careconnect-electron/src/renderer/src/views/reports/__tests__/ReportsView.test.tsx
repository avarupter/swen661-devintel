import { screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { createMemoryApi, FIXED_NOW } from '../../../../../../tests/renderer/memoryApi'
import { renderWithProviders } from '../../../../../../tests/renderer/renderApp'
import { createSeedWorkspace } from '../../../../../shared/seed'
import { statusCounts } from '../../../state/selectors'
import { ReportsView } from '../ReportsView'

function renderReports(api = createMemoryApi()) {
  return renderWithProviders(
    <main aria-label="Reports">
      <ReportsView />
    </main>,
    { api, initialUi: { view: 'reports' } }
  )
}

/** Each body or footer row as [row header, ...cells] text. */
function rowsOf(table: HTMLElement): string[][] {
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => Array.from(row.querySelectorAll('th, td'), (cell) => cell.textContent?.trim() ?? ''))
}

describe('ReportsView', () => {
  it('captions the status table and its counts match the workspace', async () => {
    await renderReports()
    const table = screen.getByRole('table', { name: 'Patients by status: count and share of 28 patients' })
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Status', 'Patients', 'Share'])
    const counts = statusCounts(createSeedWorkspace(FIXED_NOW).patients)
    expect(rowsOf(table)).toEqual([
      ['Needs review', String(counts['needs-review']), '29%'],
      ['Open', String(counts.open), '43%'],
      ['Completed', String(counts.completed), '29%'],
      ['Total', '28', '100%']
    ])
    expect(within(table).getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual(['Needs review', 'Open', 'Completed', 'Total'])
  })

  it('counts visits for each of the next seven days', async () => {
    await renderReports()
    const table = screen.getByRole('table', { name: 'Visits in the next 7 days, by day' })
    expect(rowsOf(table)).toEqual([
      ['Today · Mon, Oct 5', '3'],
      ['Tomorrow · Tue, Oct 6', '3'],
      ['Wed, Oct 7', '3'],
      ['Thu, Oct 8', '4'],
      ['Fri, Oct 9', '2'],
      ['Sat, Oct 10', '2'],
      ['Sun, Oct 11', '3'],
      ['Total', '20']
    ])
  })

  it('ranks the top five reasons for care', async () => {
    await renderReports()
    const table = screen.getByRole('table', { name: 'Top 5 reasons for care, by number of patients' })
    expect(rowsOf(table)).toEqual([
      ['Annual wellness visit', '3', '11%'],
      ['Blood pressure check', '3', '11%'],
      ['Chronic care review', '3', '11%'],
      ['Diabetes education', '3', '11%'],
      ['Mobility assessment', '3', '11%']
    ])
  })

  it('keeps the bars decorative, so the table is the source of truth', async () => {
    const { container } = await renderReports()
    const bars = container.querySelectorAll<HTMLElement>('.report-bar')
    expect(bars.length).toBeGreaterThan(0)
    for (const bar of bars) expect(bar).toHaveAttribute('aria-hidden', 'true')
    expect(within(screen.getByRole('table', { name: /Patients by status/ })).getAllByRole('row')[1].querySelector<HTMLElement>('.report-bar__fill')?.style.width).toBe('29%')
  })

  it('says that all data is synthetic', async () => {
    await renderReports()
    expect(screen.getByText(/All figures come from synthetic demo data/)).toBeInTheDocument()
  })

  it('handles an empty patient list', async () => {
    const workspace = createSeedWorkspace(FIXED_NOW)
    workspace.patients = []
    await renderReports(createMemoryApi({ workspace }))
    expect(rowsOf(screen.getByRole('table', { name: /Patients by status/ }))).toContainEqual(['Total', '0', '0%'])
    expect(screen.getByText('No reasons recorded yet.')).toBeInTheDocument()
  })

  it('is the main F6 region and has no axe violations', async () => {
    const { container } = await renderReports()
    expect(container.querySelector('main > [data-region="main"]')).not.toBeNull()
    expect(await axe(container, { rules: { 'color-contrast': { enabled: false } } })).toHaveNoViolations()
  })
})
