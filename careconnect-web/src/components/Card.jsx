/**
 * The shared card shell: surface, 24px radius, decorative border.
 *
 * `tone="soft"` is the supporting-care surface (#F4F8FF) used by the care-team
 * card on the board.
 *
 * @param {{
 *   children: import('react').ReactNode,
 *   tone?: 'surface' | 'soft',
 *   as?: 'div' | 'section' | 'article' | 'li',
 *   className?: string,
 *   'aria-labelledby'?: string,
 * }} props
 */
export default function Card({
  children,
  tone = "surface",
  as: Tag = "div",
  className = "",
  ...rest
}) {
  return (
    <Tag className={`cc-card cc-card--${tone} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
