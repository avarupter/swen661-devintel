import { useState } from 'react';
import { MapPin, Palette, Pill, Search } from 'lucide-react';
import { getMedications } from '../data/medsStore';

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function colorName(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes('calm') || lower.includes('blue')) return 'blue';
  if (lower.includes('warm') || lower.includes('orange')) return 'orange';
  if (lower.includes('success') || lower.includes('green')) return 'green';
  if (lower.includes('warning') || lower.includes('yellow')) return 'yellow';
  if (lower.includes('alert') || lower.includes('red')) return 'red';
  return 'assigned';
}

function locationFor(minutes: number): string {
  if (minutes >= 17 * 60) {
    return 'the labeled evening medicine tray on the nightstand beside the bed';
  }

  if (minutes >= 12 * 60) {
    return 'the labeled daytime medicine basket on the kitchen counter';
  }

  return 'the labeled morning medicine beside the coffee pot in the kitchen';
}

function backupLocationAnswer(): string {
  return (
    'If the medicine is not in its usual time-of-day location, check the familiar backup locations assigned for this home, such as the labeled left bathroom cabinet or the labeled medicine basket in the kitchen. Use only the location your caregiver or provider has assigned.'
  );
}

export default function MedicationMemoryPanel() {
  const [answer, setAnswer] = useState(
    'Choose a question if you need help remembering your medicine.',
  );

  function answerQuestion(eveningOnly = false) {
    const schedule = getMedications()
      .flatMap((medication) =>
        medication.times.map((time) => ({
          medication,
          minutes: toMinutes(time),
        })),
      )
      .sort((first, second) => first.minutes - second.minutes);

    if (schedule.length === 0) {
      setAnswer('No medication schedule is registered.');
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const item = eveningOnly
      ? schedule.find((entry) => entry.minutes >= 17 * 60)
      : schedule.find((entry) => entry.minutes >= currentMinutes) ?? schedule[0];

    if (!item) {
      setAnswer('No evening medication is registered.');
      return;
    }

    setAnswer(
      `${item.medication.name}: look for the ${colorName(
        item.medication.colour,
      )} color cue at ${locationFor(item.minutes)}.`,
    );
  }

  return (
    <section className="card border-2 border-calm-200 bg-calm-50">
      <h2 className="text-xl font-bold text-neutral-800">
        Help me remember my medicine
      </h2>
      <p className="mt-1 text-neutral-600">
        Use familiar color, time, and location cues.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <button
          type="button"
          onClick={() => answerQuestion()}
          className="rounded-xl border-2 border-calm-200 bg-white p-4 text-left font-bold"
        >
          <Pill className="w-5 h-5 mb-2" aria-hidden="true" />
          Which medicine is next?
        </button>

        <button
          type="button"
          onClick={() => answerQuestion()}
          className="rounded-xl border-2 border-calm-200 bg-white p-4 text-left font-bold"
        >
          <Palette className="w-5 h-5 mb-2" aria-hidden="true" />
          What color bottle should I look for?
        </button>

        <button
          type="button"
          onClick={() => answerQuestion(true)}
          className="rounded-xl border-2 border-calm-200 bg-white p-4 text-left font-bold"
        >
          <MapPin className="w-5 h-5 mb-2" aria-hidden="true" />
          Where is my evening medicine?
        </button>

        <button
          type="button"
          onClick={() => setAnswer(backupLocationAnswer())}
          className="rounded-xl border-2 border-calm-200 bg-white p-4 text-left font-bold"
        >
          <Search className="w-5 h-5 mb-2" aria-hidden="true" />
          Where else might it be?
        </button>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="mt-4 rounded-xl border-2 border-neutral-200 bg-white p-4 font-semibold"
      >
        {answer}
      </div>
    </section>
  );
}
