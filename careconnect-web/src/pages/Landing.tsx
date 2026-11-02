import { Link } from 'react-router-dom';
import {
  Heart,
  Pill,
  Calendar,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../components';
import ChatBot from '../components/ChatBot';

// ── Feature card data ──────────────────────────────────────────────────────────

const features = [
  {
    Icon: Pill,
    heading: 'Stay on top of medications',
    body: 'A clear daily checklist shows every medicine and the right time to take it — no guessing, no missed doses.',
    colour: 'text-calm-600',
    bg: 'bg-calm-100',
  },
  {
    Icon: Calendar,
    heading: 'Never miss an appointment',
    body: 'Your full day is laid out simply: meals, rest, activities, and appointments — all in one calm, easy-to-read view.',
    colour: 'text-warm-700',
    bg: 'bg-warm-100',
  },
  {
    Icon: Users,
    heading: 'Stay connected to your caregiver',
    body: 'Caregivers can leave notes, check progress, and view the same schedule — so everyone stays in the loop.',
    colour: 'text-success-700',
    bg: 'bg-success-100',
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export default function Landing() {
  return (
    <>
      {/* ── Skip link — first focusable element ───────────────────────────── */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen flex flex-col bg-neutral-50">

        {/* ══ Header ══════════════════════════════════════════════════════════ */}
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-40" role="banner">
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <span
                className="w-9 h-9 rounded-lg bg-calm-600 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-xl font-bold text-neutral-800">
                Care<span className="text-calm-600">Connect</span>
              </span>
            </div>

            {/* Header CTAs */}
            <nav aria-label="Account navigation">
              <ul className="flex items-center gap-3 list-none p-0 m-0" role="list">
                <li>
                  <Link
                    to="/signin"
                    className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-4 py-2 min-h-[2.75rem] min-w-[2.75rem] text-sm bg-white text-calm-700 border-2 border-calm-600 hover:bg-calm-50 hover:text-calm-800 transition-colors no-underline"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-4 py-2 min-h-[2.75rem] min-w-[2.75rem] text-sm bg-calm-600 text-white border-2 border-calm-600 hover:bg-calm-700 transition-colors no-underline"
                  >
                    Sign up
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        {/* ══ Main ════════════════════════════════════════════════════════════ */}
        <main id="main-content" className="flex-1" tabIndex={-1} aria-label="Main content">

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <section
            aria-labelledby="hero-heading"
            className="bg-gradient-to-b from-calm-700 to-calm-600 text-white"
          >
            <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
              <div className="max-w-2xl">
                {/* App name badge */}
                <div className="inline-flex items-center gap-2 bg-white/15 rounded-pill px-4 py-1.5 mb-6 text-sm font-semibold text-calm-100">
                  <Heart className="w-4 h-4" aria-hidden="true" />
                  CareConnect
                </div>

                {/* h1 — one per page */}
                <h1
                  id="hero-heading"
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4"
                  style={{ lineHeight: '1.15' }}
                >
                  Your daily companion for calm, confident care.
                </h1>

                {/* Supporting sentence for both audiences */}
                <p className="text-lg md:text-xl text-calm-100 leading-relaxed mb-8 max-w-xl">
                  For people who need a little help remembering, and the people who care for them.
                </p>

                {/* Primary CTAs */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 font-bold rounded-lg px-7 py-4 min-h-[3rem] text-lg bg-white text-calm-700 border-2 border-white hover:bg-calm-50 transition-colors no-underline"
                    aria-label="Sign up for CareConnect"
                  >
                    Get started — it's free
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/signin"
                    className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-7 py-4 min-h-[3rem] text-lg bg-transparent text-white border-2 border-white/60 hover:border-white hover:bg-white/10 transition-colors no-underline"
                    aria-label="Sign in to CareConnect"
                  >
                    I already have an account
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── How it helps ──────────────────────────────────────────────── */}
          <section
            aria-labelledby="features-heading"
            className="py-16 md:py-20"
          >
            <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2
                  id="features-heading"
                  className="text-2xl md:text-3xl font-bold text-neutral-800 mb-3"
                >
                  How CareConnect helps
                </h2>
                <p className="text-neutral-500 text-lg max-w-xl mx-auto">
                  Designed to be calm, clear, and reassuring — not clinical.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {features.map(({ Icon, heading, body, colour, bg }) => (
                  <Card key={heading} heading={heading} headingLevel={3}>
                    <div className="flex flex-col items-start gap-4">
                      <span
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}
                        aria-hidden="true"
                      >
                        <Icon className={`w-6 h-6 ${colour}`} />
                      </span>
                      <p className="text-neutral-600 leading-relaxed text-base">{body}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* ── Who it's for ──────────────────────────────────────────────── */}
          <section
            aria-labelledby="audiences-heading"
            className="bg-neutral-100 py-16 md:py-20"
          >
            <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
              <h2
                id="audiences-heading"
                className="text-2xl md:text-3xl font-bold text-neutral-800 text-center mb-10"
              >
                Made for two kinds of people
              </h2>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Care recipient */}
                <div className="bg-white rounded-xl border-2 border-calm-200 p-8">
                  <div className="w-14 h-14 rounded-full bg-calm-100 flex items-center justify-center mb-4" aria-hidden="true">
                    <Heart className="w-7 h-7 text-calm-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-800 mb-2">For care recipients</h3>
                  <p className="text-neutral-600 leading-relaxed mb-4">
                    Large text, simple steps, and a warm, supportive tone.
                    CareConnect never overwhelms — it just shows you what's next.
                  </p>
                  <ul className="space-y-2 list-none p-0 m-0" role="list">
                    {["Today's schedule at a glance", 'Medication reminders', 'Memory cards for people and places', 'One-tap contact for your carer'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle2 className="w-4 h-4 text-success-600 flex-shrink-0" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Caregiver */}
                <div className="bg-white rounded-xl border-2 border-success-200 p-8">
                  <div className="w-14 h-14 rounded-full bg-success-100 flex items-center justify-center mb-4" aria-hidden="true">
                    <ShieldCheck className="w-7 h-7 text-success-600" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-800 mb-2">For caregivers</h3>
                  <p className="text-neutral-600 leading-relaxed mb-4">
                    Stay in the loop without being in the room. Log notes, check
                    what's been done, and keep the care team aligned.
                  </p>
                  <ul className="space-y-2 list-none p-0 m-0" role="list">
                    {['Real-time schedule view', 'Medication tracking', 'Shift notes and priority flags', 'Emergency contact list'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-neutral-600">
                        <CheckCircle2 className="w-4 h-4 text-success-600 flex-shrink-0" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ── Bottom CTA ────────────────────────────────────────────────── */}
          <section
            aria-labelledby="cta-heading"
            className="py-16 md:py-20"
          >
            <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 text-center">
              <h2
                id="cta-heading"
                className="text-2xl md:text-3xl font-bold text-neutral-800 mb-3"
              >
                Ready to get started?
              </h2>
              <p className="text-neutral-500 text-lg mb-8 max-w-md mx-auto">
                Set up takes under two minutes — no credit card, no medical records.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 font-bold rounded-lg px-8 py-4 min-h-[3rem] text-lg bg-calm-600 text-white border-2 border-calm-600 hover:bg-calm-700 transition-colors no-underline"
                >
                  Create a free account
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center gap-2 font-semibold rounded-lg px-8 py-4 min-h-[3rem] text-lg bg-white text-calm-700 border-2 border-calm-600 hover:bg-calm-50 transition-colors no-underline"
                >
                  Sign in
                </Link>
              </div>

              {/* Trust / reassurance */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-3 text-sm text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-success-600 flex-shrink-0" aria-hidden="true" />
                  Your information is private and never shared
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-success-600 flex-shrink-0" aria-hidden="true" />
                  CareConnect never gives medical advice
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-calm-500 flex-shrink-0" aria-hidden="true" />
                  Free to use
                </span>
              </div>
            </div>
          </section>

        </main>

        {/* ══ Footer ══════════════════════════════════════════════════════════ */}
        <footer
          className="bg-neutral-800 text-neutral-300 py-8"
          role="contentinfo"
        >
          <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded-md bg-calm-600 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
                </span>
                <span className="font-semibold text-white">CareConnect</span>
              </div>
              <p className="text-sm text-neutral-400 text-center">
                &copy; {new Date().getFullYear()} CareConnect. For informational use only.
                CareConnect does not provide medical advice, diagnosis, or treatment.
              </p>
            </div>
          </div>
        </footer>

      </div>

      {/* Floating chat assistant — landing page only */}
      <ChatBot />
    </>
  );
}
