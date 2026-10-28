// ──────────────────────────────────────────────────────────────────────────────
// InstallPrompt — an accessible, dismissible "Install CareConnect" banner.
//
// Accessibility:
//   - Non-modal complementary region (role="region", aria-labelledby) so it never
//     traps focus or interrupts a task — important for screen-reader users.
//   - aria-live="polite" announces it without stealing focus.
//   - Fully keyboard usable: both buttons are real <button>s in the tab order;
//     Escape dismisses while focus is inside the banner.
//   - Dismissal is remembered (14 days) so we never nag.
//
// Mechanics: listens for the Chromium `beforeinstallprompt` event, stashes it,
// and fires it from the Install button. On browsers that don't support it
// (e.g. iOS Safari) the banner simply never shows.
// ──────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, X, Heart } from 'lucide-react';

const DISMISS_KEY = 'careconnect_install_dismissed_until';
const DISMISS_DAYS = 14;

// Minimal type for the non-standard beforeinstallprompt event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isSnoozed(): boolean {
  try {
    const until = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const installBtnRef = useRef<HTMLButtonElement>(null);

  // Capture the browser's install event and decide whether to show.
  useEffect(() => {
    if (isStandalone() || isSnoozed()) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault(); // stop Chrome's default mini-infobar
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function onInstalled() {
      setVisible(false);
      setDeferred(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const snooze = useCallback(() => {
    try {
      localStorage.setItem(
        DISMISS_KEY,
        String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
      );
    } catch {
      /* storage may be unavailable; dismissing for the session is fine */
    }
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    snooze();
  }, [snooze]);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice; // 'accepted' | 'dismissed' — either way we're done
    setVisible(false);
    setDeferred(null);
    snooze();
  }, [deferred, snooze]);

  // Escape dismisses while focus is within the banner.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        dismiss();
      }
    },
    [dismiss],
  );

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-labelledby="install-prompt-title"
      aria-live="polite"
      onKeyDown={onKeyDown}
      className="fixed inset-x-0 bottom-20 lg:bottom-6 z-50 px-4 pointer-events-none"
    >
      <div className="pointer-events-auto mx-auto max-w-md bg-white border-2 border-calm-200 rounded-card shadow-card-hover p-4 flex items-start gap-3">
        <span
          className="flex-shrink-0 w-11 h-11 rounded-xl bg-calm-100 flex items-center justify-center"
          aria-hidden="true"
        >
          <Heart className="w-6 h-6 text-calm-700" strokeWidth={2.5} />
        </span>

        <div className="flex-1 min-w-0">
          <p id="install-prompt-title" className="font-bold text-neutral-800 leading-tight">
            Install CareConnect
          </p>
          <p className="text-sm text-neutral-600 mt-0.5 leading-snug">
            Add CareConnect to your device for quick, offline access to today's plan.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              ref={installBtnRef}
              type="button"
              onClick={install}
              className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-4 py-2 min-h-[2.75rem] text-sm bg-calm-600 text-white border-2 border-calm-600 hover:bg-calm-700 hover:border-calm-700 transition-colors"
            >
              <Download className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex items-center justify-center font-semibold rounded-lg px-4 py-2 min-h-[2.75rem] text-sm bg-transparent text-neutral-600 border-2 border-transparent hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="flex-shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
