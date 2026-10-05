import { initials } from '../../../shared/format'

/** Initials badge. Decorative: the person's name is always shown or announced beside it. */
export function Avatar({ name, size = 'medium', tone = 'neutral' }: { name: string; size?: 'small' | 'medium' | 'large'; tone?: 'neutral' | 'brand' }): React.JSX.Element {
  return (
    <span className={`avatar avatar--${size} avatar--${tone}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
