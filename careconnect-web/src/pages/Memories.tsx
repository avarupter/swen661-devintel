import { useState } from 'react';
import {
  Calendar,
  Heart,
  Leaf,
  MapPin,
  Pin,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { memoryCards } from '../data/mockData';
import { useApp } from '../context/AppContext';
import type { PatientProfile } from '../context/AppContext';
import type { MemoryCard } from '../types';

const categoryConfig: Record<
  MemoryCard['category'],
  { label: string; Icon: LucideIcon }
> = {
  family: { label: 'Family', Icon: Users },
  place: { label: 'Place', Icon: MapPin },
  event: { label: 'Memory', Icon: Calendar },
  hobby: { label: 'Hobby', Icon: Leaf },
  pet: { label: 'Pet', Icon: Heart },
};

const filterLabels: Array<{
  key: MemoryCard['category'] | 'all';
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'family', label: 'Family' },
  { key: 'place', label: 'Places' },
  { key: 'event', label: 'Memories' },
  { key: 'hobby', label: 'Hobbies' },
  { key: 'pet', label: 'Pets' },
];

function displayValue(value: string) {
  return value.trim() || 'Not added yet';
}

export default function Memories() {
  const { patient, setPatient } = useApp();

  const [filter, setFilter] =
    useState<MemoryCard['category'] | 'all'>('all');

  const [expanded, setExpanded] =
    useState<string | null>(null);

  const [editing, setEditing] =
    useState(false);

  const [savedMessage, setSavedMessage] =
    useState('');

  const [draft, setDraft] =
    useState<PatientProfile>(patient);

  const filtered = memoryCards.filter(
    (card) =>
      filter === 'all' ||
      card.category === filter,
  );

  const pinned =
    filtered.filter((card) => card.pinned);

  const rest =
    filtered.filter((card) => !card.pinned);

  function startEditing() {
    setDraft(patient);
    setSavedMessage('');
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(patient);
    setEditing(false);
    setSavedMessage('');
  }

  function updateField(
    field: keyof PatientProfile,
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveProfile(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPatient({
      ...draft,
      // The signed-in account remains the source
      // of truth for the patient's name.
      name: patient.name,
    });

    setEditing(false);
    setSavedMessage(
      'Your About Me information has been saved.',
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          Memories
        </h1>

        <p className="text-neutral-500 mt-1">
          Information, people, places, and moments
          that help you remember what matters.
        </p>
      </div>

      {/* =====================================================
          ABOUT ME
      ====================================================== */}
      <section
        aria-labelledby="about-me-heading"
        className="card border-2 border-calm-200 bg-calm-50"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

          <div className="flex items-start gap-3">
            <span
              className="w-12 h-12 rounded-full bg-calm-100 flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <User className="w-6 h-6 text-calm-700" />
            </span>

            <div>
              <h2
                id="about-me-heading"
                className="text-xl font-bold text-neutral-800"
              >
                About Me
              </h2>

              <p className="text-neutral-600 mt-1">
                Important information you can return to
                whenever you need a reminder.
              </p>
            </div>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="btn btn-secondary flex-shrink-0"
            >
              Edit my information
            </button>
          )}
        </div>

        <div
          role="status"
          aria-live="polite"
          className="mt-3"
        >
          {savedMessage && (
            <p className="text-success-700 font-medium">
              {savedMessage}
            </p>
          )}
        </div>

        {editing ? (
          <form
            onSubmit={saveProfile}
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="about-name"
                className="block text-sm font-semibold text-neutral-700 mb-1.5"
              >
                My name
              </label>

              <input
                id="about-name"
                type="text"
                value={patient.name}
                readOnly
                className="w-full rounded-lg border-2 border-neutral-300 bg-neutral-100 px-3 py-2.5 text-base text-neutral-700"
              />

              <p className="text-xs text-neutral-500 mt-1">
                Your name comes from your CareConnect account.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="about-dob"
                  className="block text-sm font-semibold text-neutral-700 mb-1.5"
                >
                  My date of birth
                </label>

                <input
                  id="about-dob"
                  type="date"
                  value={draft.dateOfBirth}
                  onChange={(event) =>
                    updateField(
                      'dateOfBirth',
                      event.target.value,
                    )
                  }
                  className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="about-caregiver"
                  className="block text-sm font-semibold text-neutral-700 mb-1.5"
                >
                  My caregiver
                </label>

                <input
                  id="about-caregiver"
                  type="text"
                  value={draft.caregiverName}
                  onChange={(event) =>
                    updateField(
                      'caregiverName',
                      event.target.value,
                    )
                  }
                  placeholder="Name of caregiver"
                  className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="about-address"
                  className="block text-sm font-semibold text-neutral-700 mb-1.5"
                >
                  Where I live
                </label>

                <input
                  id="about-address"
                  type="text"
                  value={draft.homeAddress}
                  onChange={(event) =>
                    updateField(
                      'homeAddress',
                      event.target.value,
                    )
                  }
                  placeholder="Home address or familiar location"
                  className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="about-caregiver-phone"
                  className="block text-sm font-semibold text-neutral-700 mb-1.5"
                >
                  Caregiver phone
                </label>

                <input
                  id="about-caregiver-phone"
                  type="tel"
                  value={draft.caregiverPhone}
                  onChange={(event) =>
                    updateField(
                      'caregiverPhone',
                      event.target.value,
                    )
                  }
                  placeholder="Phone number"
                  className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="about-people"
                className="block text-sm font-semibold text-neutral-700 mb-1.5"
              >
                Important people in my life
              </label>

              <textarea
                id="about-people"
                rows={3}
                value={draft.importantPeople}
                onChange={(event) =>
                  updateField(
                    'importantPeople',
                    event.target.value,
                  )
                }
                placeholder="For example: Maria is my daughter. James is my brother."
                className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="about-facts"
                className="block text-sm font-semibold text-neutral-700 mb-1.5"
              >
                Things I want to remember
              </label>

              <textarea
                id="about-facts"
                rows={4}
                value={draft.importantFacts}
                onChange={(event) =>
                  updateField(
                    'importantFacts',
                    event.target.value,
                  )
                }
                placeholder="Add personal facts, routines, familiar places, or reminders that are important to you."
                className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2.5 text-base text-neutral-800 focus:border-calm-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={cancelEditing}
                className="btn btn-secondary"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
              >
                Save information
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <dt className="text-sm font-semibold text-neutral-500">
                My name
              </dt>
              <dd className="text-lg font-bold text-neutral-800 mt-1">
                {patient.name}
              </dd>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <dt className="text-sm font-semibold text-neutral-500">
                My date of birth
              </dt>
              <dd className="text-neutral-800 mt-1">
                {displayValue(patient.dateOfBirth)}
              </dd>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <dt className="text-sm font-semibold text-neutral-500">
                Where I live
              </dt>
              <dd className="text-neutral-800 mt-1">
                {displayValue(patient.homeAddress)}
              </dd>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4">
              <dt className="text-sm font-semibold text-neutral-500">
                My caregiver
              </dt>
              <dd className="text-neutral-800 mt-1">
                {displayValue(patient.caregiverName)}
              </dd>

              {patient.caregiverPhone && (
                <dd className="text-neutral-600 mt-1">
                  {patient.caregiverPhone}
                </dd>
              )}
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4 md:col-span-2">
              <dt className="text-sm font-semibold text-neutral-500">
                Important people in my life
              </dt>
              <dd className="text-neutral-800 mt-1 whitespace-pre-line">
                {displayValue(patient.importantPeople)}
              </dd>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 p-4 md:col-span-2">
              <dt className="text-sm font-semibold text-neutral-500">
                Things I want to remember
              </dt>
              <dd className="text-neutral-800 mt-1 whitespace-pre-line">
                {displayValue(patient.importantFacts)}
              </dd>
            </div>
          </dl>
        )}
      </section>

      {/* =====================================================
          MEMORY FILTERS
      ====================================================== */}
      <div
        role="group"
        aria-label="Filter memories by category"
      >
        <div className="flex flex-wrap gap-2">
          {filterLabels.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`btn text-sm px-4 py-2 min-h-0 h-10 ${
                filter === key
                  ? 'btn-primary'
                  : 'btn-secondary'
              }`}
              aria-pressed={filter === key}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {pinned.length > 0 && (
        <section aria-label="Pinned memories">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-500 uppercase tracking-wide mb-3">
            <Pin
              className="w-4 h-4"
              aria-hidden="true"
            />
            Pinned
          </h2>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 lg:items-stretch">
            {pinned.map((card) => (
              <MemoryCardItem
                key={card.id}
                card={card}
                expanded={expanded === card.id}
                onToggle={() =>
                  setExpanded(
                    expanded === card.id
                      ? null
                      : card.id,
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section aria-label="More memories">
          {pinned.length > 0 && (
            <h2 className="text-base font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              More memories
            </h2>
          )}

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 lg:items-stretch">
            {rest.map((card) => (
              <MemoryCardItem
                key={card.id}
                card={card}
                expanded={expanded === card.id}
                onToggle={() =>
                  setExpanded(
                    expanded === card.id
                      ? null
                      : card.id,
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="card text-center py-14 text-neutral-500">
          <p className="text-lg font-medium">
            No memories in this category yet.
          </p>
        </div>
      )}
    </div>
  );
}

function MemoryCardItem({
  card,
  expanded,
  onToggle,
}: {
  card: MemoryCard;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { Icon, label } =
    categoryConfig[card.category];

  return (
    <article className="card card-hover overflow-hidden p-0 h-full flex flex-col">
      {card.imageUrl && (
        <div className="w-full aspect-[16/9] overflow-hidden bg-neutral-100">
          <img
            src={card.imageUrl}
            alt={card.title}
            className="w-full h-full object-cover object-center"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-calm text-xs">
                <Icon
                  className="w-3 h-3"
                  aria-hidden="true"
                />
                {label}
              </span>

              {card.pinned && (
                <span className="badge badge-neutral text-xs">
                  <Pin
                    className="w-3 h-3"
                    aria-hidden="true"
                  />
                  Pinned
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-neutral-800 leading-tight">
              {card.title}
            </h3>
          </div>
        </div>

        <div>
          <p
            id={`memory-body-${card.id}`}
            className={`text-neutral-600 text-base leading-relaxed ${
              !expanded
                ? 'line-clamp-3'
                : ''
            }`}
          >
            {card.body}
          </p>

          {card.body.length > 120 && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-2 text-sm font-medium text-calm-600 hover:text-calm-700 underline underline-offset-2 bg-transparent border-0 p-0 h-auto min-h-0 min-w-0 cursor-pointer"
              aria-expanded={expanded}
              aria-controls={`memory-body-${card.id}`}
            >
              {expanded
                ? 'Show less'
                : 'Read more'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}