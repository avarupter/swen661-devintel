import { render, screen } from '@testing-library/react'
import type { PatientStatus } from '../../../../shared/model'
import { StatusChip } from '../StatusChip'

describe('StatusChip', () => {
  it.each<[PatientStatus, string]>([
    ['needs-review', 'Needs review'],
    ['open', 'Open'],
    ['completed', 'Completed']
  ])('shows %s with an icon and a word, never colour alone', (status, label) => {
    const { container } = render(<StatusChip status={status} />)
    const chip = container.querySelector('.chip') as HTMLElement
    expect(chip).toHaveClass(`chip--${status}`)
    expect(chip).toHaveTextContent(label)
    const icon = chip.querySelector('svg.chip__icon') as SVGElement
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(icon.childElementCount).toBeGreaterThan(0)
    expect(screen.getByText(label)).toBe(chip)
  })

  it('uses a different icon for each status', () => {
    const shapes = (['needs-review', 'open', 'completed'] as const).map((status) => {
      const { container, unmount } = render(<StatusChip status={status} />)
      const shape = container.querySelector('svg')?.innerHTML
      unmount()
      return shape
    })
    expect(new Set(shapes).size).toBe(3)
  })
})
