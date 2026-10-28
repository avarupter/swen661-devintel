import { useId } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type BaseFieldProps = {
  /**
   * The visible label text. Always rendered — never hidden or placeholder-only.
   */
  label: string;
  /**
   * When provided, renders a hint line below the input and wires it to the
   * input via aria-describedby.
   */
  hint?: string;
  /**
   * When provided, the field is in an error state:
   * - aria-invalid="true" is set on the input
   * - The message renders inline in red below the input (not as a tooltip)
   * - The error message is also wired via aria-describedby
   */
  error?: string;
  /**
   * When true, a required marker (*) is shown next to the label and
   * aria-required="true" is set on the input.
   */
  required?: boolean;
  /**
   * Optional slot for an icon or decoration placed inside the input's
   * leading edge (left side). Purely visual — aria-hidden.
   */
  leadingIcon?: ReactNode;
  /** Extra CSS classes forwarded to the outermost wrapper <div> */
  className?: string;
};

export type FieldProps = BaseFieldProps &
  (
    | ({ multiline?: false } & InputHTMLAttributes<HTMLInputElement>)
    | ({ multiline: true }  & TextareaHTMLAttributes<HTMLTextAreaElement>)
  );

// ── Shared style constants ────────────────────────────────────────────────────

const inputBase =
  'block w-full rounded-lg border-2 bg-white px-4 py-3 ' +
  'text-base text-neutral-800 placeholder:text-neutral-400 ' +
  'min-h-[2.75rem] ' + // 44px touch target
  'transition-colors duration-200 ' +
  'focus:outline-none '; // outline handled globally via *:focus-visible

const inputNormal =
  inputBase +
  'border-neutral-300 ' +
  'hover:border-neutral-400 ' +
  'focus:border-calm-600 ';

const inputError =
  inputBase +
  'border-alert-500 ' +
  'hover:border-alert-600 ' +
  'focus:border-alert-600 ';

const inputWithIcon = 'pl-11 '; // offset for the leading icon

// ── Component ─────────────────────────────────────────────────────────────────

export default function Field(props: FieldProps) {
  const {
    label,
    hint,
    error,
    required = false,
    leadingIcon,
    className = '',
    multiline,
    ...rest
  } = props;

  // Stable unique IDs — no collisions even with multiple instances
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const hintId  = `${baseId}-hint`;
  const errorId = `${baseId}-error`;

  const hasError = Boolean(error);

  // Build aria-describedby from whichever secondary elements exist
  const describedBy = [hint && hintId, hasError && errorId]
    .filter(Boolean)
    .join(' ') || undefined;

  const inputClasses = [
    hasError ? inputError : inputNormal,
    leadingIcon ? inputWithIcon : '',
  ]
    .filter(Boolean)
    .join('');

  const sharedInputProps = {
    id: inputId,
    'aria-describedby': describedBy,
    'aria-invalid': hasError ? ('true' as const) : undefined,
    'aria-required': required || undefined,
    required,
  };

  return (
    <div className={['space-y-1.5', className].filter(Boolean).join(' ')}>
      {/* ── Label — always visible ────────────────────────────────────────── */}
      <label
        htmlFor={inputId}
        className="block text-base font-semibold text-neutral-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-alert-600" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>

      {/* ── Input wrapper ──────────────────────────────────────────────────── */}
      <div className="relative">
        {leadingIcon && (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        )}

        {multiline ? (
          <textarea
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            {...sharedInputProps}
            className={[inputClasses, 'resize-y min-h-[7rem]'].join(' ')}
          />
        ) : (
          <input
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
            {...sharedInputProps}
            className={inputClasses}
          />
        )}
      </div>

      {/* ── Hint (non-error helper text) ──────────────────────────────────── */}
      {hint && !hasError && (
        <p id={hintId} className="text-sm text-neutral-500 leading-snug">
          {hint}
        </p>
      )}

      {/* ── Inline error message ──────────────────────────────────────────── */}
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-sm font-medium text-alert-700 leading-snug"
        >
          {/* Decorative exclamation mark — screen readers get the text */}
          <span aria-hidden="true" className="flex-shrink-0 font-bold">!</span>
          {error}
        </p>
      )}
    </div>
  );
}
