import type { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, type LucideIcon } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

export interface BannerProps {
  /**
   * Visual and semantic variant.
   * - 'info' and 'success' and 'warning' use role="status" (polite) —
   *   the announcement waits for the current speech to finish.
   * - 'error' uses role="alert" (assertive) — announced immediately,
   *   interrupting any ongoing speech. Use sparingly and only for
   *   genuine errors that block the user.
   */
  variant: BannerVariant;
  /** Primary message text or rich content */
  children: ReactNode;
  /**
   * Optional heading rendered above the message in bold.
   * Helps screen-reader users understand the banner type quickly.
   */
  title?: string;
  /**
   * When provided, renders an accessible dismiss button.
   * Caller is responsible for hiding the banner on dismiss.
   */
  onDismiss?: () => void;
  /** Extra CSS classes forwarded to the root element */
  className?: string;
}

// ── Variant config ────────────────────────────────────────────────────────────
// Colours verified: all text/bg pairs meet WCAG AA ≥4.5:1 for small text.

const variantConfig: Record<
  BannerVariant,
  {
    role: 'status' | 'alert';
    ariaLive: 'polite' | 'assertive';
    container: string;
    iconWrapper: string;
    titleColour: string;
    bodyColour: string;
    dismissColour: string;
    Icon: LucideIcon;
    defaultTitle: string;
  }
> = {
  info: {
    role: 'status',
    ariaLive: 'polite',
    container:     'bg-calm-50 border-calm-300 text-calm-800',
    iconWrapper:   'text-calm-600',
    titleColour:   'text-calm-900',
    bodyColour:    'text-calm-800',
    dismissColour: 'text-calm-600 hover:bg-calm-100 hover:text-calm-900',
    Icon: Info,
    defaultTitle: 'Information',
  },
  success: {
    role: 'status',
    ariaLive: 'polite',
    container:     'bg-success-50 border-success-300 text-success-800',
    iconWrapper:   'text-success-600',
    titleColour:   'text-success-900',
    bodyColour:    'text-success-800',
    dismissColour: 'text-success-600 hover:bg-success-100 hover:text-success-900',
    Icon: CheckCircle2,
    defaultTitle: 'Success',
  },
  warning: {
    role: 'status',
    ariaLive: 'polite',
    container:     'bg-warning-50 border-warning-300 text-warning-800',
    iconWrapper:   'text-warning-600',
    titleColour:   'text-warning-900',
    bodyColour:    'text-warning-800',
    dismissColour: 'text-warning-600 hover:bg-warning-100 hover:text-warning-900',
    Icon: AlertTriangle,
    defaultTitle: 'Warning',
  },
  error: {
    role: 'alert',
    ariaLive: 'assertive',
    container:     'bg-alert-50 border-alert-300 text-alert-800',
    iconWrapper:   'text-alert-600',
    titleColour:   'text-alert-900',
    bodyColour:    'text-alert-800',
    dismissColour: 'text-alert-600 hover:bg-alert-100 hover:text-alert-900',
    Icon: AlertTriangle,
    defaultTitle: 'Error',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Banner({
  variant,
  children,
  title,
  onDismiss,
  className = '',
}: BannerProps) {
  const cfg = variantConfig[variant];

  return (
    <div
      role={cfg.role}
      aria-live={cfg.ariaLive}
      aria-atomic="true"
      className={[
        'flex items-start gap-3 rounded-xl border-2 p-4',
        cfg.container,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Icon */}
      <span
        className={['flex-shrink-0 mt-0.5', cfg.iconWrapper].join(' ')}
        aria-hidden="true"
      >
        <cfg.Icon className="w-5 h-5" aria-hidden="true" />
      </span>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={['font-bold text-base leading-tight mb-1', cfg.titleColour].join(' ')}>
            {title}
          </p>
        )}
        <div className={['text-base leading-relaxed', cfg.bodyColour].join(' ')}>
          {children}
        </div>
      </div>

      {/* Optional dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss this message"
          className={[
            'flex-shrink-0 flex items-center justify-center',
            'w-8 h-8 rounded-lg transition-colors duration-150',
            cfg.dismissColour,
          ].join(' ')}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
