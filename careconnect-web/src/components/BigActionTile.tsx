import type { ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BigActionTileProps {
  icon: ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  colour?: 'calm' | 'warm' | 'success' | 'neutral';
  className?: string;
}

// ── Colour tokens ─────────────────────────────────────────────────────────────
// Background, text, icon wrapper, and hover state all verified for contrast.

const colourMap: Record<
  NonNullable<BigActionTileProps['colour']>,
  { tile: string; icon: string; label: string; hover: string; active: string }
> = {
  calm: {
    tile:   'bg-calm-50 border-calm-300',
    icon:   'bg-calm-100 text-calm-700',
    label:  'text-calm-800',
    hover:  'hover:bg-calm-100 hover:border-calm-400',
    active: 'active:bg-calm-200',
  },
  warm: {
    tile:   'bg-warm-50 border-warm-300',
    icon:   'bg-warm-100 text-warm-700',
    label:  'text-warm-800',
    hover:  'hover:bg-warm-100 hover:border-warm-400',
    active: 'active:bg-warm-200',
  },
  success: {
    tile:   'bg-success-50 border-success-300',
    icon:   'bg-success-100 text-success-700',
    label:  'text-success-800',
    hover:  'hover:bg-success-100 hover:border-success-400',
    active: 'active:bg-success-200',
  },
  neutral: {
    tile:   'bg-neutral-100 border-neutral-300',
    icon:   'bg-neutral-200 text-neutral-700',
    label:  'text-neutral-800',
    hover:  'hover:bg-neutral-200 hover:border-neutral-400',
    active: 'active:bg-neutral-300',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function BigActionTile({
  icon,
  label,
  description,
  onClick,
  disabled = false,
  colour = 'calm',
  className = '',
}: BigActionTileProps) {
  const colours = colourMap[colour];
  const ariaLabel = description ? `${label} — ${description}` : label;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        'flex flex-col items-center justify-center gap-3',
        'min-h-[6rem] w-full px-3 py-4',
        'rounded-xl border-2',
        'transition-all duration-200 select-none',
        colours.tile,
        colours.hover,
        colours.active,
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Icon circle */}
      <span
        className={[
          'flex items-center justify-center',
          'w-14 h-14 rounded-full',
          colours.icon,
          'transition-colors duration-200',
        ].join(' ')}
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Label */}
      <span
        className={[
          'text-base font-semibold text-center leading-tight',
          colours.label,
        ].join(' ')}
      >
        {label}
      </span>
    </button>
  );
}
