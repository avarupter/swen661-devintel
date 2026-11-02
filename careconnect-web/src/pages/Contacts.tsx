import { Phone, AlertTriangle, User, Stethoscope, ShieldAlert, Users, type LucideIcon } from 'lucide-react';
import { contacts } from '../data/mockData';
import type { Contact, ContactRole } from '../types';

const roleConfig: Record<
  ContactRole,
  { label: string; Icon: LucideIcon }
> = {
  caregiver: { label: 'Carer',     Icon: ShieldAlert },
  family:    { label: 'Family',    Icon: Users },
  doctor:    { label: 'Doctor',    Icon: Stethoscope },
  emergency: { label: 'Emergency', Icon: AlertTriangle },
};

export default function Contacts() {
  const emergency = contacts.filter((c) => c.isEmergency);
  const others = contacts.filter((c) => !c.isEmergency);

  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Contacts</h1>
        <p className="text-neutral-500 mt-1">People who are here to help you</p>
      </div>

      {/* ── Emergency contacts ──────────────────────────────────────────── */}
      <section aria-label="Emergency contacts">
        <h2 className="text-base font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-alert-600" aria-hidden="true" />
          Emergency contacts
        </h2>
        <ul className="space-y-3 list-none p-0 m-0" role="list">
          {emergency.map((c) => (
            <li key={c.id}>
              <ContactCard contact={c} highlight />
            </li>
          ))}
        </ul>
      </section>

      {/* ── Other contacts ───────────────────────────────────────────────── */}
      <section aria-label="Other contacts">
        <h2 className="text-base font-semibold text-neutral-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <User className="w-4 h-4" aria-hidden="true" />
          Other contacts
        </h2>
        <ul className="space-y-3 list-none p-0 m-0" role="list">
          {others.map((c) => (
            <li key={c.id}>
              <ContactCard contact={c} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ContactCard({ contact, highlight }: { contact: Contact; highlight?: boolean }) {
  const { label: roleLabel, Icon: RoleIcon } = roleConfig[contact.role];

  return (
    <article
      className={`card card-hover flex items-center gap-4 p-4 ${
        highlight ? 'border-alert-200 bg-alert-50' : ''
      }`}
      aria-label={`${contact.name}, ${roleLabel}`}
    >
      {/* Avatar */}
      <div
        className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-base ${contact.avatarColour}`}
        aria-hidden="true"
      >
        {contact.avatarInitials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-neutral-800 text-base leading-tight">
            {contact.name}
          </span>
          <span
            className={`badge text-xs ${
              contact.role === 'emergency'
                ? 'badge-alert'
                : contact.role === 'caregiver'
                ? 'badge-calm'
                : contact.role === 'doctor'
                ? 'badge-warning'
                : 'badge-neutral'
            }`}
          >
            <RoleIcon className="w-3 h-3" aria-hidden="true" />
            {roleLabel}
          </span>
        </div>
        {contact.notes && (
          <p className="text-sm text-neutral-500 mt-0.5 leading-snug">{contact.notes}</p>
        )}
      </div>

      {/* Call button */}
      <a
        href={`tel:${contact.phone.replace(/\s/g, '')}`}
        className={`flex-shrink-0 flex items-center gap-2 btn text-sm px-4 py-2 min-h-0 h-11 no-underline ${
          contact.role === 'emergency' ? 'btn-primary bg-alert-600 border-alert-600 hover:bg-alert-700 hover:border-alert-700' : 'btn-secondary'
        }`}
        aria-label={`Call ${contact.name} on ${contact.phone}`}
      >
        <Phone className="w-4 h-4" aria-hidden="true" />
        <span className="hidden md:inline">{contact.phone}</span>
        <span className="md:hidden">Call</span>
      </a>
    </article>
  );
}
