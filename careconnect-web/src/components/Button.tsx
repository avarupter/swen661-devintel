import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import ConfirmDialog from './ConfirmDialog';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps {
  /** Visible label text */
  children: ReactNode;
  /** Visual and semantic variant. 'danger' always shows a confirmation dialog first. */
  variant?: ButtonVariant;
  /** Optional Lucide (or any) icon rendered before the label */
  icon?: ReactNode;
  /** Disabled state — prevents click and is communicated to assistive technology */
  disabled?: boolean;
  /** Click handler. For 'danger' variant this fires only after the user confirms. */
  onClick?: () => void;
  /** Passed to the underlying <button> for form submission control */
  type?: 'button' | 'submit' | 'reset';
  /** Extra CSS classes forwarded to the root element */
  className?: string;
  /** Accessible label when the visible label alone is insufficient */
  'aria-label'?: string;
  /**
   * Confirmation dialog copy for the 'danger' variant.
   * Defaults are provided but callers should supply context-specific text.
   */
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
}

// ── Variant styles ────────────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-calm-600 text-white border-2 border-calm-600 ' +
    'hover:bg-calm-700 hover:border-calm-700 ' +
    'active:bg-calm-800 active:border-calm-800',
  secondary:
    'bg-white text-calm-700 border-2 border-calm-600 ' +
    'hover:bg-calm-50 hover:text-calm-800 hover:border-calm-700 ' +
    'active:bg-calm-100',
  danger:
    'bg-alert-600 text-white border-2 border-alert-600 ' +
    'hover:bg-alert-700 hover:border-alert-700 ' +
    'active:bg-alert-800 active:border-alert-800',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Button({
  children,
  variant = 'primary',
  icon,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
  confirmTitle = 'Are you sure?',
  confirmDescription = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
}: ButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function handleClick() {
    if (variant === 'danger') {
      setConfirmOpen(true);
    } else {
      onClick?.();
    }
  }

  function handleConfirm() {
    setConfirmOpen(false);
    onClick?.();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type={type}
        disabled={disabled}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        className={[
          // Base shared styles — mirror .btn from index.css without @apply leaking
          'inline-flex items-center justify-center gap-2',
          'font-semibold rounded-lg',
          'px-5 py-3',
          'min-h-[2.75rem] min-w-[2.75rem]', // 44px touch target
          'cursor-pointer select-none whitespace-nowrap',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {icon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
      </button>

      {/* Danger confirmation — only rendered when triggered */}
      {variant === 'danger' && (
        <ConfirmDialog
          open={confirmOpen}
          title={confirmTitle}
          description={confirmDescription}
          confirmLabel={confirmLabel}
          triggerRef={triggerRef}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
