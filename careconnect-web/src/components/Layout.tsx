import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  CalendarDays,
  Pill,
  BookOpen,
  Phone,
  ShieldCheck,
  Heart,
  LogOut,
  ArrowLeftRight,
  PhoneCall,
  LayoutDashboard,
  Activity,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useApp } from '../context/AppContext';
import type { AppView } from '../types';

// ── Nav definitions ────────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
}

const patientNav: NavItem[] = [
  { to: '/app',               label: 'Home',         Icon: Home },
  { to: '/app/schedule',     label: 'My Day',       Icon: Calendar },
  { to: '/app/appointments', label: 'Appointments', Icon: CalendarDays },
  { to: '/app/medications',  label: 'Medicines',    Icon: Pill },
  { to: '/app/memories',     label: 'Memories',     Icon: BookOpen },
  { to: '/app/contacts',     label: 'Contacts',     Icon: Phone },
];

const caregiverNav: NavItem[] = [
  { to: '/app',                      label: 'Dashboard',    Icon: LayoutDashboard },
  { to: '/app/manage-medications',   label: 'Medications',  Icon: Pill },
  { to: '/app/manage-appointments',  label: 'Appointments', Icon: CalendarDays },
  { to: '/app/activity',             label: 'Activity',     Icon: Activity },
  { to: '/app/caregiver',            label: 'Notes',        Icon: ShieldCheck },
];

// ── Screen title lookup ────────────────────────────────────────────────────────

const SCREEN_TITLES: Record<string, string> = {
  '/app':                     'Home',
  '/app/schedule':            'My Day',
  '/app/appointments':        'My Appointments',
  '/app/medications':         'Medicines',
  '/app/memories':            'Memories',
  '/app/contacts':            'Contacts',
  '/app/caregiver':           'Caregiver Notes',
  '/app/activity':            'Activity Log',
  '/app/manage-medications':  'Manage Medications',
  '/app/manage-appointments': 'Manage Appointments',
};

function useScreenTitle(): string {
  const { pathname } = useLocation();
  return SCREEN_TITLES[pathname] ?? 'CareConnect';
}

// ── Live clock ────────────────────────────────────────────────────────────────

function useLiveClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Sync to the next whole minute, then tick every 60 s
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
    const timeout = setTimeout(() => {
      setNow(new Date());
      const interval = setInterval(() => setNow(new Date()), 60_000);
      return () => clearInterval(interval);
    }, msToNextMinute);
    return () => clearTimeout(timeout);
  }, []);
  return now;
}

function formatOrientationDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function formatOrientationTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getGreeting(d: Date, firstName: string): string {
  const h = d.getHours();
  const salutation =
    h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return firstName ? `${salutation}, ${firstName}` : salutation;
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;
  view: AppView;
  /** Switches the current view and persists it as the user's default role */
  onSwitchRole: () => void;
  onSignOut: () => void;
}

// ── Caregiver contact for the "Call" button ────────────────────────────────────
// In mock data Joyce Adeyemi is the caregiver carer contact.
const CAREGIVER_PHONE = '07700900456';
const CAREGIVER_DISPLAY = 'Joyce — 07700 900 456';

// ── Component ──────────────────────────────────────────────────────────────────

export default function Layout({
  children,
  view,
  onSwitchRole,
  onSignOut,
}: LayoutProps) {
  const { user } = useAuth();
  const { patient } = useApp();
  const now = useLiveClock();
  const screenTitle = useScreenTitle();
  const location = useLocation();

  const isPatient = view === 'patient';
  const nav = isPatient ? patientNav : caregiverNav;

  const dateStr = formatOrientationDate(now);
  const timeStr = formatOrientationTime(now);
  const firstName = user?.name?.split(' ')[0] ?? '';
  const greeting = getGreeting(now, firstName);

  // ISO datetime for <time> element
  const isoDateTime = now.toISOString().slice(0, 16);

  return (
    <>
      {/* ── Skip link — very first focusable element ──────────────────────
          Tab order: 1. skip link → 2. orientation bar → 3. main → 4. nav     */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen flex flex-col bg-neutral-50">

        {/* ══════════════════════════════════════════════════════════════════
            HEADER  =  Orientation bar
            Tab order stop #2 — contains logo, switch-role, sign-out,
            date/time, greeting, screen title, and call button.
        ══════════════════════════════════════════════════════════════════ */}
        <header
          role="banner"
          className="bg-white border-b-2 border-neutral-200 shadow-sm sticky top-0 z-40"
        >
          {/* ── Utility strip (app controls, secondary) ───────────────── */}
          <div className="border-b border-neutral-100 px-4 md:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
            {/* Logo */}
            <a
              href="/app"
              className="flex items-center gap-2 no-underline flex-shrink-0"
              aria-label="CareConnect — go to home"
            >
              <span
                className="w-8 h-8 rounded-lg bg-calm-600 flex items-center justify-center"
                aria-hidden="true"
              >
                <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-base font-bold text-neutral-800 hidden sm:inline leading-none">
                Care<span className="text-calm-600">Connect</span>
              </span>
            </a>

            {/* Role indicator pill */}
            <span
              className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-sm font-semibold ${
                isPatient
                  ? 'bg-calm-100 text-calm-700'
                  : 'bg-success-100 text-success-700'
              }`}
            >
              {isPatient ? (
                <Heart className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {isPatient ? 'Care recipient' : 'Caregiver'}
            </span>

            {/* Controls */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={onSwitchRole}
                className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-3 py-2 min-h-[2.75rem] min-w-[2.75rem] text-sm bg-white text-calm-700 border-2 border-calm-600 hover:bg-calm-50 transition-colors"
                aria-label={
                  isPatient
                    ? 'Switch to caregiver role'
                    : 'Switch to care recipient role'
                }
              >
                <ArrowLeftRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Switch role</span>
              </button>

              <button
                onClick={onSignOut}
                className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-3 py-2 min-h-[2.75rem] min-w-[2.75rem] text-sm bg-transparent text-neutral-500 border-2 border-transparent hover:bg-neutral-100 hover:text-neutral-800 transition-colors"
                aria-label="Sign out of CareConnect"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {/* ── Orientation bar (primary — large text) ────────────────── */}
          <div className="px-4 md:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            {/* Date / time / greeting / screen title block */}
            <div className="space-y-1">

              {/* Date + time — large, always visible */}
              <div className="flex items-baseline gap-3 flex-wrap">
                <time
                  dateTime={isoDateTime}
                  className="text-2xl md:text-3xl font-bold text-neutral-800 leading-tight"
                >
                  {dateStr}
                </time>
                <span
                  className="text-2xl md:text-3xl font-bold text-calm-600 tabular-nums leading-tight"
                  aria-label={`Current time: ${timeStr}`}
                >
                  {timeStr}
                </span>
              </div>

              {/* Greeting + screen title */}
              <p className="text-lg text-neutral-600 leading-snug flex items-center gap-2 flex-wrap">
                <span>{greeting}</span>
                <span aria-hidden="true" className="text-neutral-300">·</span>
                <span
                  className="font-semibold text-neutral-800"
                  aria-label={`Current screen: ${screenTitle}`}
                >
                  {screenTitle}
                </span>
              </p>

              {/* Caregiver: whose plan */}
              {!isPatient && (
                <p
                  className="text-sm font-semibold text-success-700"
                  aria-live="polite"
                >
                  Viewing {patient.name}'s care plan
                </p>
              )}
            </div>

            {/* Call my caregiver — patient screens only */}
            {isPatient && (
              <a
                href={`tel:${CAREGIVER_PHONE}`}
                className="inline-flex items-center justify-center gap-3 font-bold rounded-xl px-6 py-3 min-h-[3rem] text-base bg-success-600 text-white border-2 border-success-600 hover:bg-success-700 hover:border-success-700 transition-colors no-underline flex-shrink-0 self-start md:self-center"
                aria-label={`Call your caregiver: ${CAREGIVER_DISPLAY}`}
              >
                <PhoneCall className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                Call my caregiver
              </a>
            )}
          </div>
        </header>

        {/* ══════════════════════════════════════════════════════════════════
            BODY — layout differs by role
            Patient:   single column, bottom nav fixed at bottom (DOM last)
            Caregiver: flex row; main (DOM first → tab #3), sidebar nav (DOM
                       second → tab #4), visually left via CSS order
        ══════════════════════════════════════════════════════════════════ */}
        <div
          className={`flex-1 flex ${
            isPatient
              ? 'flex-col'
              : 'flex-col lg:flex-row'
          }`}
        >

          {/* ── MAIN CONTENT — tab stop #3 ───────────────────────────── */}
          <main
            id="main-content"
            tabIndex={-1}
            aria-label="Main content"
            className={[
              'flex-1 min-w-0',
              'px-4 md:px-6 lg:px-8 py-6',
              'page-enter',
              // Caregiver desktop: main is visually on the right
              !isPatient ? 'lg:order-2' : '',
              // Patient: extra bottom padding so content clears fixed bottom nav
              isPatient ? 'pb-28 lg:pb-6' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {children}
          </main>

          {/* ── CAREGIVER SIDEBAR — tab stop #4, visually left via order-1 ── */}
          {!isPatient && (
            <nav
              aria-label="Main navigation"
              className={[
                // Desktop: fixed-width sidebar, visually left
                'lg:order-1 lg:flex-shrink-0 lg:w-56',
                'lg:border-r-2 lg:border-neutral-200 lg:bg-white',
                'lg:sticky lg:top-[var(--header-h,9rem)]',
                // Mobile: horizontal strip below header, above main
                'order-first',          // mobile: above main
                'flex lg:flex-col',
                'bg-white border-b-2 lg:border-b-0 border-neutral-200',
                'overflow-x-auto lg:overflow-x-visible',
                'px-2 lg:px-3 py-2 lg:py-4',
                'gap-1',
              ]
                .join(' ')}
            >
              {/* Caregiver nav items */}
              <ul
                className="flex lg:flex-col gap-1 list-none p-0 m-0 min-w-max lg:min-w-0 w-full"
                role="list"
              >
                {nav.map(({ to, label, Icon }) => (
                  <li key={to} className="flex-shrink-0 lg:flex-shrink lg:w-full">
                    <NavLink
                      to={to}
                      end={to === '/app'}
                      aria-current={location.pathname === to ? 'page' : undefined}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-lg',
                          'text-sm lg:text-base font-medium no-underline',
                          'min-h-[2.75rem] min-w-[2.75rem]',
                          'transition-colors duration-150 whitespace-nowrap',
                          isActive
                            ? 'bg-calm-100 text-calm-700 font-semibold'
                            : 'text-neutral-500 hover:text-calm-600 hover:bg-calm-50',
                        ].join(' ')
                      }
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>

              {/* Switch role inside sidebar — supplemental shortcut */}
              <div className="hidden lg:block mt-auto pt-4 border-t border-neutral-200">
                <button
                  onClick={onSwitchRole}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-calm-600 hover:bg-calm-50 transition-colors min-h-[2.75rem]"
                  aria-label="Switch to care recipient role"
                >
                  <Heart className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  Switch to patient
                </button>
              </div>
            </nav>
          )}
        </div>

        {/* ── PATIENT BOTTOM NAV — tab stop #4, fixed at bottom ─────────── */}
        {isPatient && (
          <nav
            aria-label="Main navigation"
            className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-neutral-200 z-40 pb-[env(safe-area-inset-bottom)]"
          >
            <ul
              className="flex items-stretch justify-around list-none p-0 m-0"
              role="list"
            >
              {nav.map(({ to, label, Icon }) => (
                // min-w-0 lets each tab shrink below its label width, so long
                // labels truncate instead of forcing horizontal page scroll.
                <li key={to} className="flex-1 min-w-0">
                  <NavLink
                    to={to}
                    end={to === '/app'}
                    aria-current={location.pathname === to ? 'page' : undefined}
                    className={({ isActive }) =>
                      [
                        'flex flex-col items-center justify-center gap-1',
                        'w-full min-w-0 py-2.5 px-1',
                        'min-h-[3.5rem]',
                        'text-xs font-medium no-underline',
                        'transition-colors duration-150',
                        isActive
                          ? 'text-calm-700 bg-calm-50'
                          : 'text-neutral-500 hover:text-calm-600',
                      ].join(' ')
                    }
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
                    <span className="leading-none w-full max-w-full text-center truncate">
                      {label}
                    </span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer
          className="hidden lg:block border-t border-neutral-200 bg-white"
          role="contentinfo"
        >
          <div className="max-w-none px-8 py-4 flex items-center justify-between text-sm text-neutral-400">
            <p>CareConnect &copy; {new Date().getFullYear()} — Compassionate care, every day.</p>
            <p>
              Need help?{' '}
              <a href="/app/contacts" className="text-calm-600 font-medium">
                View contacts
              </a>
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}
