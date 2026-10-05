import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { App } from '../App'

describe('App (toolchain smoke test)', () => {
  it('renders the application heading with no axe violations', async () => {
    const { container } = render(<App />)
    expect(screen.getByRole('heading', { name: 'CareConnect' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})
