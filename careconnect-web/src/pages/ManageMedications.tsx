import { useState, useRef, useId, type FormEvent } from 'react';
import {
  Pill,
  PlusCircle,
  Pencil,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Button, Field, Card } from '../components';
import { getMedications, saveMedications, pickColour } from '../data/medsStore';
import type { Medication } from '../types';

// ── Time helper ────────────────────────────────────────────────────────────────

function fmt12(hhmm: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// ── Form types ─────────────────────────────────────────────────────────────────

interface MedForm {
  name: string;
  dosage: string;
  times: string[];
  instructions: string;
}

interface MedErrors {
  name?: string;
  dosage?: string;
  times?: string;
  instructions?: string;
}

const emptyForm: MedForm = { name: '', dosage: '', times: [''], instructions: '' };

function validate(form: MedForm): MedErrors {
  const e: MedErrors = {};
  if (!form.name.trim()) e.name = 'Medication name is required.';
  if (!form.dosage.trim()) e.dosage = 'Dosage is required.';
  if (!form.times.some((t) => t.trim())) e.times = 'At least one scheduled time is required.';
  return e;
}

function formToMed(form: MedForm, existing?: Medication, allCount = 0): Medication {
  return {
    id: existing?.id ?? `med-${Date.now()}`,
    name: form.name.trim(),
    dosage: form.dosage.trim(),
    times: form.times.filter((t) => t.trim()),
    instructions: form.instructions.trim() || undefined,
    colour: existing?.colour ?? pickColour(allCount),
    taken: existing?.taken ?? {},
  };
}

function medToForm(med: Medication): MedForm {
  return {
    name: med.name,
    dosage: med.dosage,
    times: med.times.length ? med.times : [''],
    instructions: med.instructions ?? '',
  };
}

// ── Inline error paragraph (matches Field's style) ─────────────────────────────

function InlineError({ id, message }: { id: string; message: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1.5 text-sm font-medium text-alert-700 leading-snug"
    >
      <span aria-hidden="true" className="flex-shrink-0 font-bold">!</span>
      {message}
    </p>
  );
}

// ── Med form ───────────────────────────────────────────────────────────────────

function MedForm({
  initial,
  allCount,
  onSave,
  onCancel,
}: {
  initial?: Medication;
  allCount: number;
  onSave: (med: Medication) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<MedForm>(initial ? medToForm(initial) : emptyForm);
  const [errors, setErrors] = useState<MedErrors>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const timesLegendId = useId();
  const timesErrorId = useId();
  const errorSummaryId = useId();

  const hasErrors = Object.keys(errors).length > 0;

  function set(field: keyof MedForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function setTime(i: number, val: string) {
    setForm((f) => {
      const times = [...f.times];
      times[i] = val;
      return { ...f, times };
    });
  }

  function addTime() {
    setForm((f) => ({ ...f, times: [...f.times, ''] }));
  }

  function removeTime(i: number) {
    setForm((f) => ({ ...f, times: f.times.filter((_, idx) => idx !== i) }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Move focus to error summary so screen readers announce it
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    onSave(formToMed(form, initial, allCount));
  }

  return (
    <section
      aria-labelledby="med-form-heading"
      className="bg-white rounded-xl border-2 border-neutral-300 shadow-card p-6 space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="med-form-heading" className="text-xl font-bold text-neutral-800">
          {initial ? 'Edit medication' : 'Add new medication'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
          aria-label="Cancel and close form"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Error summary */}
      {hasErrors && (
        <div
          ref={summaryRef}
          id={errorSummaryId}
          role="alert"
          tabIndex={-1}
          aria-live="assertive"
          className="bg-alert-50 border-2 border-alert-300 rounded-xl px-5 py-4 space-y-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-alert-600 focus-visible:outline-offset-2"
        >
          <p className="font-bold text-alert-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            Please fix the following before saving:
          </p>
          <ul className="list-disc list-inside space-y-1">
            {Object.values(errors).map((msg) => (
              <li key={msg} className="text-sm text-alert-700">
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={hasErrors ? errorSummaryId : undefined}
        className="space-y-6"
      >
        {/* Name */}
        <Field
          label="Medication name (required)"
          required
          placeholder="e.g. Amlodipine"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          autoComplete="off"
        />

        {/* Dosage */}
        <Field
          label="Dose (required)"
          required
          placeholder="e.g. 5 mg — 1 tablet"
          hint="Include strength, form, and quantity."
          value={form.dosage}
          onChange={set('dosage')}
          error={errors.dosage}
        />

        {/* Times */}
        <fieldset className="space-y-3">
          <legend
            id={timesLegendId}
            className="block text-base font-semibold text-neutral-700"
          >
            Schedule times (required)
            <span className="ml-1 text-alert-600" aria-hidden="true">*</span>
            <span className="sr-only"> — at least one time is required</span>
          </legend>

          <div className="space-y-2">
            {form.times.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <label htmlFor={`time-${i}`} className="sr-only">
                  {form.times.length === 1 ? 'Time' : `Time ${i + 1}`}
                </label>
                <input
                  id={`time-${i}`}
                  type="time"
                  value={t}
                  onChange={(e) => setTime(i, e.target.value)}
                  aria-invalid={errors.times ? 'true' : undefined}
                  aria-describedby={errors.times ? timesErrorId : undefined}
                  className={[
                    'rounded-lg border-2 px-4 py-3 text-base text-neutral-800 min-h-[2.75rem]',
                    'focus:outline-none transition-colors',
                    errors.times
                      ? 'border-alert-500 focus:border-alert-600'
                      : 'border-neutral-300 hover:border-neutral-400 focus:border-calm-600',
                  ].join(' ')}
                />
                {form.times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTime(i)}
                    className="text-sm font-semibold text-alert-600 hover:text-alert-700 min-h-[2.75rem] px-2 transition-colors"
                    aria-label={`Remove time ${i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {errors.times && <InlineError id={timesErrorId} message={errors.times} />}

          <button
            type="button"
            onClick={addTime}
            className="inline-flex items-center gap-2 text-sm font-semibold text-calm-600 hover:text-calm-700 min-h-[2.75rem] transition-colors"
            aria-label="Add another scheduled time"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            Add another time
          </button>
        </fieldset>

        {/* Instructions */}
        <Field
          label="Instructions / notes"
          multiline
          placeholder="e.g. Take with food. Avoid grapefruit juice."
          hint="Optional — patient-facing instructions shown on the medicines screen."
          value={form.instructions}
          onChange={set('instructions')}
          error={errors.instructions}
        />

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-200">
          <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-5 h-5" />}>
            {initial ? 'Save changes' : 'Add medication'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}

// ── Medication list row ────────────────────────────────────────────────────────

function MedRow({
  med,
  onEdit,
  onDelete,
}: {
  med: Medication;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li>
      <Card heading={med.name} headingLevel={3}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-600">
            <span className="font-medium">{med.dosage}</span>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Scheduled times">
            {med.times.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 bg-calm-100 text-calm-700 text-sm font-semibold px-3 py-1 rounded-pill"
              >
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {fmt12(t)}
              </span>
            ))}
          </div>

          {med.instructions && (
            <p className="text-sm text-neutral-500 italic">{med.instructions}</p>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
            <Button
              variant="secondary"
              icon={<Pencil className="w-4 h-4" />}
              onClick={onEdit}
              aria-label={`Edit ${med.name}`}
              className="text-sm px-4 py-2 min-h-0 h-10"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={onDelete}
              confirmTitle="Delete medication"
              confirmDescription={`Are you sure you want to delete ${med.name}? This cannot be undone and will remove it from Margaret's medicines list.`}
              confirmLabel="Yes, delete"
              aria-label={`Delete ${med.name}`}
              className="text-sm px-4 py-2 min-h-0 h-10"
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Mode = 'list' | 'add' | { edit: string };

export default function ManageMedications() {
  const [meds, setMeds] = useState<Medication[]>(getMedications);
  const [mode, setMode] = useState<Mode>('list');
  const addButtonRef = useRef<HTMLButtonElement>(null);

  function persist(updated: Medication[]) {
    setMeds(updated);
    saveMedications(updated);
  }

  function handleSave(med: Medication) {
    if (mode === 'add') {
      persist([...meds, med]);
    } else if (typeof mode === 'object') {
      persist(meds.map((m) => (m.id === mode.edit ? med : m)));
    }
    setMode('list');
    requestAnimationFrame(() => addButtonRef.current?.focus());
  }

  function handleDelete(id: string) {
    persist(meds.filter((m) => m.id !== id));
  }

  const editingMed =
    typeof mode === 'object' ? meds.find((m) => m.id === mode.edit) : undefined;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 leading-tight flex items-center gap-3">
            <Pill className="w-8 h-8 text-warm-600" aria-hidden="true" />
            Manage medications
          </h1>
          <p className="mt-1 text-lg text-neutral-500">
            Add, edit, or remove Margaret's prescriptions
          </p>
        </div>

        {mode === 'list' && (
          <button
            ref={addButtonRef}
            onClick={() => setMode('add')}
            className="inline-flex items-center gap-2 font-bold rounded-xl px-5 py-3 min-h-[2.75rem] text-base bg-calm-600 text-white border-2 border-calm-600 hover:bg-calm-700 transition-colors"
            aria-label="Add new medication"
          >
            <PlusCircle className="w-5 h-5" aria-hidden="true" />
            Add medication
          </button>
        )}
      </div>

      {/* ── Add / Edit form ───────────────────────────────────────────────── */}
      {mode !== 'list' && (
        <MedForm
          initial={editingMed}
          allCount={meds.length}
          onSave={handleSave}
          onCancel={() => {
            setMode('list');
            requestAnimationFrame(() => addButtonRef.current?.focus());
          }}
        />
      )}

      {/* ── Medication list ───────────────────────────────────────────────── */}
      {mode === 'list' && (
        <section aria-labelledby="meds-list-heading">
          <h2 id="meds-list-heading" className="sr-only">
            Current medications
          </h2>

          {meds.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-neutral-300 shadow-card p-10 text-center space-y-3">
              <span
                className="inline-flex w-16 h-16 rounded-full bg-warm-100 items-center justify-center mx-auto"
                aria-hidden="true"
              >
                <Pill className="w-8 h-8 text-warm-600" />
              </span>
              <p className="text-xl font-bold text-neutral-800">No medications added yet</p>
              <p className="text-neutral-500">
                Use the "Add medication" button above to add Margaret's first prescription.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 list-none p-0 m-0" role="list">
              {meds.map((med) => (
                <MedRow
                  key={med.id}
                  med={med}
                  onEdit={() => setMode({ edit: med.id })}
                  onDelete={() => handleDelete(med.id)}
                />
              ))}
            </ul>
          )}
        </section>
      )}

    </div>
  );
}
