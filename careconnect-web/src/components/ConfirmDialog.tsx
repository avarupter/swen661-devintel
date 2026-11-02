import {
  useEffect,
  useId,
  useRef,
} from 'react';

import type {
  RefObject,
} from 'react';

import {
  AlertTriangle,
  X,
} from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onConfirm: () => void;
  onCancel: () => void;
}

const TABBABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

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
  const dialogRef =
    useRef<HTMLDivElement>(
      null,
    );

  const wasOpen =
    useRef(false);

  const headingId =
    useId();

  const descriptionId =
    useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    wasOpen.current = true;

    const dialog =
      dialogRef.current;

    if (!dialog) {
      return;
    }

    const currentDialog = dialog;

    const first =
      dialog.querySelector<HTMLElement>(
        TABBABLE,
      );

    first?.focus();

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        event.preventDefault();
        onCancel();
        return;
      }

      if (
        event.key !==
        'Tab'
      ) {
        return;
      }

      const controls =
        Array.from(
          currentDialog.querySelectorAll<HTMLElement>(
            TABBABLE,
          ),
        );

      if (!controls.length) {
        return;
      }

      const firstControl =
        controls[0];

      const lastControl =
        controls[
          controls.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement ===
          firstControl
      ) {
        event.preventDefault();
        lastControl.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement ===
          lastControl
      ) {
        event.preventDefault();
        firstControl.focus();
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () =>
      document.removeEventListener(
        'keydown',
        handleKeyDown,
      );
  }, [open, onCancel]);

  useEffect(() => {
    if (
      !open &&
      wasOpen.current
    ) {
      triggerRef.current?.focus();
      wasOpen.current = false;
    }
  }, [
    open,
    triggerRef,
  ]);

  useEffect(() => {
    document.body.style.overflow =
      open ? 'hidden' : '';

    return () => {
      document.body.style.overflow =
        '';
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="presentation"
      onClick={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onCancel();
        }
      }}
    >
      <div
        className="absolute inset-0 bg-neutral-900/50"
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          headingId
        }
        aria-describedby={
          description
            ? descriptionId
            : undefined
        }
        className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl border border-neutral-200 p-6 space-y-5"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close confirmation"
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
        >
          <X
            className="w-5 h-5"
            aria-hidden="true"
          />
        </button>

        <div className="flex items-start gap-4 pr-8">
          <span
            className="w-11 h-11 rounded-full bg-alert-100 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <AlertTriangle className="w-6 h-6 text-alert-700" />
          </span>

          <div>
            <h2
              id={headingId}
              className="text-xl font-bold text-neutral-800"
            >
              {title}
            </h2>

            {description && (
              <p
                id={
                  descriptionId
                }
                className="mt-2 text-neutral-600"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <hr className="border-neutral-200" />

        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-5 py-3 font-semibold bg-white text-neutral-700 border-2 border-neutral-300"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg px-5 py-3 font-semibold bg-alert-600 text-white border-2 border-alert-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}