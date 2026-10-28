import { useState, useRef, useId, type FormEvent } from 'react';
import {
  CalendarDays,
  PlusCircle,
  Pencil,
  Clock,
  MapPin,
  Phone,
  Home,
  Building2,
  User2,
  Info,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Field, Card } from '../components';
import { getAppointments, saveAppointments } from '../data/apptStore';
import type { Appointment, AppointmentLocationType } from '../data/appointmentsData';

// ── Date/time helpers ──────────────────────────────────────────────────────────

function fmt12(hhmm: string): string {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ── Location icon map ──────────────────────────────────────────────────────────

const LOCATION_ICON: Record<AppointmentLocationType, LucideIcon> = {
  clinic: MapPin,
  hospital: Building2,
  telephone: Phone,
  home: Home,
};

const LOCATION_LABELS: Record<AppointmentLocationType, string> = {
  clinic: 'Clinic visit',
  hospital: 'Hospital visit',
  telephone: 'Telephone — no travel needed',
  home: 'Home visit — they come to you',
};

// ── Form types ─────────────────────────────────────────────────────────────────

interface ApptForm {
  title: string;
  date: string;
  time: string;
  locationName: string;
  locationAddress: string;
  locationType: AppointmentLocationType | '';
  caregiver: string;
  notes: string;
}

interface ApptErrors {
  title?: string;
  date?: string;
  time?: string;
  locationName?: string;
  locationType?: string;
}

const emptyForm: ApptForm = {
  title: '',
  date: '',
  time: '',
  locationName: '',
  locationAddress: '',
  locationType: '',
  caregiver: '',
  notes: '',
};

function validate(form: ApptForm): ApptErrors {
  const e: ApptErrors = {};
  if (!form.title.trim()) e.title = 'Appointment title is required.';
  if (!form.date) e.date = 'Date is required.';
  if (!form.time) e.time = 'Time is required.';
  if (!form.locationName.trim()) e.locationName = 'Location name is required.';
  if (!form.locationType) e.locationType = 'Location type is required.';
  return e;
}

function formToAppt(form: ApptForm, existing?: Appointment): Appointment {
  return {
    id: existing?.id ?? `appt-${Date.now()}`,
    title: form.title.trim(),
    date: form.date,
    time: form.time,
    location: {
      name: form.locationName.trim(),
      address: form.locationAddress.trim() || undefined,
      type: form.locationType as AppointmentLocationType,
    },
    caregiver: form.caregiver.trim() || undefined,
    notes: form.notes.trim() || undefined,
    isInMyDay: existing?.isInMyDay ?? false,
  };
}

function apptToForm(appt: Appointment): ApptForm {
  return {
    title: appt.title,
    date: appt.date,
    time: appt.time,
    locationName: appt.location.name,
    locationAddress: appt.location.address ?? '',
    locationType: appt.location.type,
    caregiver: appt.caregiver ?? '',
    notes: appt.notes ?? '',
  };
}

// ── Inline error paragraph ─────────────────────────────────────────────────────

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

// ── Accessible select row ─────────────────────────────────────────────────────

function SelectField({
  label,
  id,
  value,
  onChange,
  error,
  errorId,
  children,
  required = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  errorId: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-base font-semibold text-neutral-700">
        {label}
        {required && (
          <span className="ml-1 text-alert-600" aria-hidden="true">*</span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          'block w-full rounded-lg border-2 px-4 py-3 text-base text-neutral-800',
          'min-h-[2.75rem] focus:outline-none transition-colors bg-white',
          error
            ? 'border-alert-500 focus:border-alert-600'
            : 'border-neutral-300 hover:border-neutral-400 focus:border-calm-600',
        ].join(' ')}
      >
        {children}
      </select>
      {error && <InlineError id={errorId} message={error} />}
    </div>
  );
}

// ── Appointment form ───────────────────────────────────────────────────────────

function ApptForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Appointment;
  onSave: (appt: Appointment) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ApptForm>(initial ? apptToForm(initial) : emptyForm);
  const [errors, setErrors] = useState<ApptErrors>({});
  const summaryRef = useRef<HTMLDivElement>(null);
  const errorSummaryId = useId();
  const locTypeId = useId();
  const locTypeErrorId = useId();

  const hasErrors = Object.keys(errors).length > 0;

  function setField(field: keyof ApptForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    setErrors({});
    onSave(formToAppt(form, initial));
  }

  return (
    <section
      aria-labelledby="appt-form-heading"
      className="bg-white rounded-xl border-2 border-neutral-300 shadow-card p-6 space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 id="appt-form-heading" className="text-xl font-bold text-neutral-800">
          {initial ? 'Edit appointment' : 'Add new appointment'}
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
        {/* Title */}
        <Field
          label="Appointment title (required)"
          required
          placeholder="e.g. Blood pressure check — Dr. Sharma"
          hint="Use plain language Margaret will recognise."
          value={form.title}
          onChange={setField('title')}
          error={errors.title}
        />

        {/* Date + Time row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Date (required)"
            required
            type="date"
            min={todayStr()}
            value={form.date}
            onChange={setField('date')}
            error={errors.date}
          />
          <Field
            label="Time (required)"
            required
            type="time"
            value={form.time}
            onChange={setField('time')}
            error={errors.time}
          />
        </div>

        {/* Location section */}
        <fieldset className="space-y-4 border-t border-neutral-200 pt-5">
          <legend className="text-base font-bold text-neutral-700 -mt-3 bg-white pr-2">
            Location
          </legend>

          {/* Location type select */}
          <SelectField
            label="Location type (required)"
            id={locTypeId}
            value={form.locationType}
            onChange={(v) =>
              setForm((f) => ({ ...f, locationType: v as AppointmentLocationType | '' }))
            }
            error={errors.locationType}
            errorId={locTypeErrorId}
            required
          >
            <option value="">Select type…</option>
            {(Object.entries(LOCATION_LABELS) as [AppointmentLocationType, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ),
            )}
          </SelectField>

          {/* Location name */}
          <Field
            label="Location name (required)"
            required
            placeholder={
              form.locationType === 'telephone'
                ? 'e.g. Telephone — Dr. Sharma will call you'
                : 'e.g. Greenfield Surgery'
            }
            value={form.locationName}
            onChange={setField('locationName')}
            error={errors.locationName}
          />

          {/* Address — only meaningful for physical locations */}
          {form.locationType !== 'telephone' && form.locationType !== '' && (
            <Field
              label="Address"
              placeholder="e.g. 12 Greenfield Road, Westfield"
              hint="Optional — used for the 'Get directions' button on the patient screen."
              value={form.locationAddress}
              onChange={setField('locationAddress')}
            />
          )}
        </fieldset>

        {/* Caregiver + Notes */}
        <div className="space-y-5">
          <Field
            label="Assigned caregiver"
            placeholder="e.g. Joyce Adeyemi"
            hint="Optional — shown to Margaret as 'Joyce is taking you to this appointment'."
            value={form.caregiver}
            onChange={setField('caregiver')}
          />

          <Field
            label="Patient notes"
            multiline
            placeholder="Instructions or reassurance for Margaret, e.g. 'No need to fast beforehand.'"
            hint="Optional — shown in plain language on the patient appointments screen."
            value={form.notes}
            onChange={setField('notes')}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-neutral-200">
          <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-5 h-5" />}>
            {initial ? 'Save changes' : 'Add appointment'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}

// ── Appointment list row ───────────────────────────────────────────────────────

function ApptRow({
  appt,
  onEdit,
  onDelete,
}: {
  appt: Appointment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const LocIcon = LOCATION_ICON[appt.location.type];
  const today = todayStr();
  const isToday = appt.date === today;

  return (
    <li>
      <Card
        heading={appt.title}
        headingLevel={3}
        className={isToday ? 'border-calm-300' : ''}
        actions={
          isToday ? (
            <span className="inline-flex items-center gap-1.5 bg-calm-100 text-calm-700 text-sm font-bold px-3 py-1 rounded-pill flex-shrink-0">
              <CalendarDays className="w-3.5 h-3.5" aria-hidden="true" />
              Today
            </span>
          ) : undefined
        }
      >
        <div className="space-y-3">
          {/* Date + time */}
          <div className="flex items-center gap-2 text-sm text-neutral-600 flex-wrap">
            <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" aria-hidden="true" />
            <time dateTime={`${appt.date}T${appt.time}`} className="font-semibold text-neutral-800">
              {formatFullDate(appt.date)} — {fmt12(appt.time)}
            </time>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <LocIcon className="w-4 h-4 text-calm-600 flex-shrink-0" aria-hidden="true" />
            <span>
              {appt.location.name}
              {appt.location.address && (
                <span className="text-neutral-400"> — {appt.location.address}</span>
              )}
            </span>
          </div>

          {/* Caregiver */}
          {appt.caregiver && (
            <div className="flex items-center gap-2 text-sm text-success-700 bg-success-50 rounded-lg px-3 py-2 border border-success-200">
              <User2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span className="font-semibold">{appt.caregiver}</span>
              <span className="font-normal text-success-600">is assigned</span>
            </div>
          )}

          {/* Notes */}
          {appt.notes && (
            <div className="flex items-start gap-2 text-sm text-neutral-500 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-200">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-snug">{appt.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
            <Button
              variant="secondary"
              icon={<Pencil className="w-4 h-4" />}
              onClick={onEdit}
              aria-label={`Edit: ${appt.title}`}
              className="text-sm px-4 py-2 min-h-0 h-10"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={onDelete}
              confirmTitle="Delete appointment"
              confirmDescription={`Are you sure you want to delete "${appt.title}"? This cannot be undone.`}
              confirmLabel="Yes, delete"
              aria-label={`Delete: ${appt.title}`}
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

export default function ManageAppointments() {
  const [appts, setAppts] = useState<Appointment[]>(getAppointments);
  const [mode, setMode] = useState<Mode>('list');
  const addButtonRef = useRef<HTMLButtonElement>(null);

  function persist(updated: Appointment[]) {
    setAppts(updated);
    saveAppointments(updated);
  }

  function handleSave(appt: Appointment) {
    if (mode === 'add') {
      persist([...appts, appt]);
    } else if (typeof mode === 'object') {
      persist(appts.map((a) => (a.id === mode.edit ? appt : a)));
    }
    setMode('list');
    requestAnimationFrame(() => addButtonRef.current?.focus());
  }

  function handleDelete(id: string) {
    persist(appts.filter((a) => a.id !== id));
  }

  const editingAppt =
    typeof mode === 'object' ? appts.find((a) => a.id === mode.edit) : undefined;

  // Sort by date then time for the list view
  const sorted = [...appts].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.time < b.time ? -1 : 1;
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800 leading-tight flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-calm-600" aria-hidden="true" />
            Manage appointments
          </h1>
          <p className="mt-1 text-lg text-neutral-500">
            Add, edit, or remove Margaret's upcoming appointments
          </p>
        </div>

        {mode === 'list' && (
          <button
            ref={addButtonRef}
            onClick={() => setMode('add')}
            className="inline-flex items-center gap-2 font-bold rounded-xl px-5 py-3 min-h-[2.75rem] text-base bg-calm-600 text-white border-2 border-calm-600 hover:bg-calm-700 transition-colors"
            aria-label="Add new appointment"
          >
            <PlusCircle className="w-5 h-5" aria-hidden="true" />
            Add appointment
          </button>
        )}
      </div>

      {/* ── Add / Edit form ───────────────────────────────────────────────── */}
      {mode !== 'list' && (
        <ApptForm
          initial={editingAppt}
          onSave={handleSave}
          onCancel={() => {
            setMode('list');
            requestAnimationFrame(() => addButtonRef.current?.focus());
          }}
        />
      )}

      {/* ── Appointment list ──────────────────────────────────────────────── */}
      {mode === 'list' && (
        <section aria-labelledby="appts-list-heading">
          <h2 id="appts-list-heading" className="sr-only">
            All appointments
          </h2>

          {sorted.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-neutral-300 shadow-card p-10 text-center space-y-3">
              <span
                className="inline-flex w-16 h-16 rounded-full bg-calm-100 items-center justify-center mx-auto"
                aria-hidden="true"
              >
                <CalendarDays className="w-8 h-8 text-calm-600" />
              </span>
              <p className="text-xl font-bold text-neutral-800">No appointments yet</p>
              <p className="text-neutral-500">
                Use the "Add appointment" button above to schedule Margaret's first visit.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 list-none p-0 m-0" role="list">
              {sorted.map((appt) => (
                <ApptRow
                  key={appt.id}
                  appt={appt}
                  onEdit={() => setMode({ edit: appt.id })}
                  onDelete={() => handleDelete(appt.id)}
                />
              ))}
            </ul>
          )}
        </section>
      )}

    </div>
  );
}
