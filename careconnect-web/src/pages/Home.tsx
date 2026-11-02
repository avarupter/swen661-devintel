import { Calendar, Pill, Phone, BookOpen, Sun, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { scheduleItems, medications } from '../data/mockData';
import type { AppView } from '../types';

interface HomeProps {
  view: AppView;
}

const categoryEmoji: Record<string, string> = {
  meal: '🍽',
  medication: '💊',
  activity: '🌿',
  appointment: '📞',
  rest: '🛌',
};

export default function Home({ view }: HomeProps) {
  const now = new Date();
  const hours = now.getHours();
  const greeting =
    hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';

  const todayDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const upcomingItems = scheduleItems
    .filter((item) => !item.done)
    .slice(0, 3);

  const doneCount = scheduleItems.filter((i) => i.done).length;
  const totalCount = scheduleItems.length;

  const pendingMeds = medications.filter(
    (m) => !m.taken[new Date().toISOString().split('T')[0]]
  ).length;

  const isPatient = view === 'patient';

  return (
    <div className="space-y-6">
      {/* ── Greeting banner ──────────────────────────────────────────────── */}
      <section aria-label="Greeting">
        <div className="card bg-gradient-to-br from-calm-600 to-calm-700 text-white border-calm-700">
          <div className="flex items-start gap-4">
            <span
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <Sun className="w-6 h-6 text-white" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isPatient ? `${greeting}, Dorothy!` : `${greeting}, Joyce!`}
              </h1>
              <p className="text-calm-100 mt-1 text-base">
                {isPatient
                  ? `Today is ${todayDate}. Here is your day at a glance.`
                  : `Viewing Dorothy's care plan for ${todayDate}.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick stats ───────────────────────────────────────────────────── */}
      <section aria-label="Today's summary">
        <h2 className="sr-only">Today's summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Tasks done"
            value={`${doneCount} / ${totalCount}`}
            icon={<CheckCircle2 className="w-5 h-5 text-success-600" aria-hidden="true" />}
            accent="text-success-700"
          />
          <StatCard
            label="Medicines left"
            value={pendingMeds.toString()}
            icon={<Pill className="w-5 h-5 text-warm-600" aria-hidden="true" />}
            accent={pendingMeds > 0 ? 'text-warm-700' : 'text-success-700'}
          />
          <StatCard
            label="Appointments"
            value="1"
            icon={<Phone className="w-5 h-5 text-calm-600" aria-hidden="true" />}
            accent="text-calm-700"
          />
          <StatCard
            label="Memory cards"
            value="6"
            icon={<BookOpen className="w-5 h-5 text-neutral-500" aria-hidden="true" />}
            accent="text-neutral-700"
          />
        </div>
      </section>

      {/* ── What's next ───────────────────────────────────────────────────── */}
      <section aria-label="What's next today">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-calm-600" aria-hidden="true" />
            What's next today
          </h2>
          <Link to="/schedule" className="text-sm font-medium text-calm-600 no-underline hover:underline">
            See full day
          </Link>
        </div>
        {upcomingItems.length === 0 ? (
          <div className="card text-center text-neutral-500 py-10">
            <CheckCircle2 className="w-10 h-10 text-success-500 mx-auto mb-3" aria-hidden="true" />
            <p className="font-medium text-neutral-700">All done for today!</p>
            <p className="text-sm mt-1">What a great day.</p>
          </div>
        ) : (
          <ul className="space-y-3 list-none p-0 m-0" role="list">
            {upcomingItems.map((item) => (
              <li key={item.id}>
                <div className="card card-hover flex items-center gap-4 p-4">
                  <span
                    className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100"
                    aria-hidden="true"
                  >
                    {categoryEmoji[item.category]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-800 text-base leading-tight">
                      {item.label}
                    </p>
                    {item.description && (
                      <p className="text-sm text-neutral-500 mt-0.5 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <time
                    dateTime={item.time}
                    className="text-calm-700 font-semibold text-base flex-shrink-0 tabular-nums"
                  >
                    {formatTime(item.time)}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Quick links ───────────────────────────────────────────────────── */}
      <section aria-label="Quick links">
        <h2 className="text-xl font-semibold text-neutral-800 mb-3">Quick links</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { to: '/schedule',    Icon: Calendar, label: 'My Day',     colour: 'bg-calm-50 text-calm-700 border-calm-200' },
            { to: '/medications', Icon: Pill,      label: 'Medicines',  colour: 'bg-warm-50 text-warm-700 border-warm-200' },
            { to: '/memories',    Icon: BookOpen,  label: 'Memories',   colour: 'bg-success-50 text-success-700 border-success-200' },
            { to: '/contacts',    Icon: Phone,     label: 'Contacts',   colour: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
          ].map(({ to, Icon, label, colour }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-2 rounded-card border p-5 min-h-touch font-semibold text-sm no-underline transition-shadow duration-200 hover:shadow-card ${colour}`}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500 font-medium">{label}</span>
        {icon}
      </div>
      <span className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</span>
    </div>
  );
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}
