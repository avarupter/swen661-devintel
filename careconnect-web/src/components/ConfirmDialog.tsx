import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { AlertTriangle, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConfirmDialogProps {
  /** Controls visibility */
  open: boolean;
  /** Dialog heading — also used as aria-labelledby target */
  title: string;
  /** Explanatory paragraph shown below the title */
  description?: string;
  /** Label for the confirm/proceed button (default: "Confirm") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Ref of the element that opened the dialog; focus returns here on close */
  triggerRef: RefObject<HTMLButtonElement | null>;
  /** Called when the user clicks the confirm button */
  onConfirm: () => void;
  /** Called when the user cancels (Escape key, Cancel button, backdrop click) */
  onCancel: () => void;
}

// ── Selectors for tabbable elements within the dialog ─────────────────────────

const TABBABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
  'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  triggerRef,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useRef(`dialog-title-${Math.random().toString(36).slice(2)}`);
  const descId = useRef(`dialog-desc-${Math.random().toString(36).slice(2)}`);

  // ── Focus management ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    // Move focus into the dialog on open (to the first tabbable child)
    const dialog = dialogRef.current;
    if (!dialog) return;

    const firstFocusable = dialog.querySelectorAll<HTMLElement>(TABBABLE)[0];
    firstFocusable?.focus();

    // ── Focus trap ──────────────────────────────────────────────────────────

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = Array.from(dialog!.querySelectorAll<HTMLElement>(TABBABLE));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  // Return focus to trigger on close
  useEffect(() => {
    if (!open) {
      triggerRef.current?.focus();
    }
  }, [open, triggerRef]);

  // Block body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={(e) => {
        // Close on backdrop click, but not when clicking inside the dialog
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-neutral-900/50"
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId.current}
        aria-describedby={description ? descId.current : undefined}
        className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 p-6 space-y-5"
      >
        {/* Close (X) button — top-right */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Icon + heading */}
        <div className="flex items-start gap-4 pr-8">
          <span
            className="flex-shrink-0 w-11 h-11 rounded-full bg-alert-100 flex items-center justify-center"
            aria-hidden="true"
          >
            <AlertTriangle className="w-6 h-6 text-alert-600" />
          </span>
          <div>
            <h2
              id={headingId.current}
              className="text-xl font-bold text-neutral-800 leading-tight"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descId.current}
                className="mt-1.5 text-base text-neutral-600 leading-relaxed"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="border-neutral-200" />

        {/* Action row */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
          <button
            onClick={onCancel}
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-5 py-3 min-h-[2.75rem] min-w-[2.75rem] cursor-pointer bg-white text-neutral-700 border-2 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-5 py-3 min-h-[2.75rem] min-w-[2.75rem] cursor-pointer bg-alert-600 text-white border-2 border-alert-600 hover:bg-alert-700 hover:border-alert-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
