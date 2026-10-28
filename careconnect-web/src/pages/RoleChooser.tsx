import { useNavigate } from 'react-router-dom';
import { Heart, ShieldCheck } from 'lucide-react';
import { BigActionTile } from '../components';
import { useAuth } from '../auth/AuthContext';
import { useApp } from '../context/AppContext';

export default function RoleChooser() {
  const { setRole, user } = useAuth();
  const { setPatient } = useApp();
  const navigate = useNavigate();

  function choose(role: 'patient' | 'caregiver') {
    // Persist the mock patient profile (always "Margaret")
    setPatient({ name: 'Margaret' });
    setRole(role);
    navigate('/app');
  }

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <>
      {/* Skip link */}
      <a href="#role-chooser-main" className="skip-link">
        Skip to role selection
      </a>

      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Minimal header — no nav, no orientation bar */}
        <header className="bg-white border-b border-neutral-200" role="banner">
          <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center">
            <span className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-lg bg-calm-600 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-bold text-neutral-800">
                Care<span className="text-calm-600">Connect</span>
              </span>
            </span>
          </div>
        </header>

        <main
          id="role-chooser-main"
          className="flex-1 flex items-center justify-center px-4 py-12"
          tabIndex={-1}
          aria-label="Choose your role"
        >
          <div className="w-full max-w-xl space-y-8">

            {/* Heading */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">
                {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
              </h1>
              <p className="text-neutral-500 text-lg">
                How are you using CareConnect right now?
              </p>
              <p className="text-sm text-neutral-400">
                Your choice is remembered. You can switch at any time from inside the app.
              </p>
            </div>

            {/* Role tiles */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
              role="group"
              aria-label="Choose your role"
            >
              <BigActionTile
                icon={<Heart className="w-10 h-10" aria-hidden="true" />}
                label="I am the Care Recipient"
                description="View your daily schedule, medicines, memory aids, and contacts"
                colour="calm"
                onClick={() => choose('patient')}
              />
              <BigActionTile
                icon={<ShieldCheck className="w-10 h-10" aria-hidden="true" />}
                label="I am the Caregiver"
                description="Manage the care plan, add shift notes, and track medicines"
                colour="success"
                onClick={() => choose('caregiver')}
              />
            </div>

            {/* Reassurance */}
            <p className="text-center text-sm text-neutral-400">
              This does not affect what information is stored — only which view you see first.
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
