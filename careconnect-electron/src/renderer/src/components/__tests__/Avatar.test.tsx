import { render } from '@testing-library/react'
import { Avatar } from '../Avatar'
import { Icon } from '../Icon'

describe('Avatar', () => {
  it('shows initials, decoratively, at the default size and tone', () => {
    const { container } = render(<Avatar name="Avery Park" />)
    const avatar = container.firstElementChild as HTMLElement
    expect(avatar).toHaveTextContent('AP')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar).toHaveClass('avatar', 'avatar--medium', 'avatar--neutral')
  })

  it('supports the large brand avatar used in the patient header', () => {
    const { container } = render(<Avatar name="Jordan Lee, RN" size="large" tone="brand" />)
    expect(container.firstElementChild).toHaveClass('avatar--large', 'avatar--brand')
    expect(container.firstElementChild).toHaveTextContent('JR')
  })
})

describe('Icon', () => {
  it('is a decorative inline SVG that never takes focus', () => {
    const { container } = render(<Icon name="search" />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveClass('icon')
    expect(svg.childElementCount).toBeGreaterThan(0)
  })

  it('adds an extra class', () => {
    const { container } = render(<Icon name="check" className="chip__icon" />)
    expect(container.querySelector('svg')).toHaveClass('icon', 'chip__icon')
  })
})
