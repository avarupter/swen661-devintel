import { useState, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, LogIn } from 'lucide-react';
import { Field } from '../components';
import { useAuth } from '../auth/AuthContext';

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const errorSummaryId = useId();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!email.trim())         next.email    = 'Please enter your email address.';
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Please enter a valid email address.';
    if (!password)             next.password = 'Please enter your password.';
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError('');
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (result.error) {
      setGlobalError(result.error);
      return;
    }
    navigate('/role');
  }

  const hasFieldErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-neutral-200" role="banner">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="CareConnect home">
            <span className="w-9 h-9 rounded-lg bg-calm-600 flex items-center justify-center" aria-hidden="true">
              <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
            </span>
            <span className="text-xl font-bold text-neutral-800">
              Care<span className="text-calm-600">Connect</span>
            </span>
          </Link>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 py-12"
        aria-label="Sign in"
      >
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-xl border-2 border-neutral-200 shadow-card p-8 space-y-6">
            {/* Heading */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-neutral-800">Welcome back</h1>
              <p className="text-neutral-500 mt-1 text-base">Sign in to your CareConnect account.</p>
            </div>

            {/* Error summary — for screen readers and keyboard users */}
            {(hasFieldErrors || globalError) && (
              <div
                id={errorSummaryId}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="rounded-lg border-2 border-alert-300 bg-alert-50 px-4 py-3 text-sm text-alert-800 font-medium"
              >
                {globalError
                  ? globalError
                  : 'Please correct the errors below to continue.'}
              </div>
            )}

            {/* Form */}
            <form
              noValidate
              onSubmit={handleSubmit}
              aria-describedby={hasFieldErrors || globalError ? errorSummaryId : undefined}
              className="space-y-5"
            >
              <Field
                label="Email address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                error={errors.email}
                required
                placeholder="you@example.com"
              />

              <Field
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
                error={errors.password}
                required
                hint="Any password works — this is a demonstration app."
              />

              <button
                type="submit"
                disabled={submitting}
                aria-disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 font-bold rounded-lg px-5 py-4 min-h-[3rem] text-base bg-calm-600 text-white border-2 border-calm-600 hover:bg-calm-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="w-5 h-5" aria-hidden="true" />
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            {/* Switch link */}
            <p className="text-center text-sm text-neutral-500">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-calm-600">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
