import { useState } from 'react';
import { PhoneCall, Save } from 'lucide-react';
import Memories from './Memories';
import { getExtendedProfile, saveExtendedProfile } from '../data/profileSupport';

type EditableField = 'dateOfBirth' | 'maritalStatus' | 'gender' | 'familyMemberName' | 'familyMemberPhone';

export default function MemoriesEnhanced() {
  const [profile, setProfile] = useState(getExtendedProfile);
  const [savedMessage, setSavedMessage] = useState('');

  function update(field: EditableField, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function save() {
    saveExtendedProfile(profile);
    setSavedMessage('Personal details saved.');
  }

  return (
    <div className="space-y-6">
      <section className="card border-2 border-calm-200">
        <h2 className="text-xl font-bold text-neutral-800">About Me - Personal Details</h2>
        <p className="mt-1 text-neutral-600">These details can help with orientation and contacting someone familiar.</p>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <label className="font-semibold text-neutral-700">Date of birth<input type="date" value={profile.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} className="block w-full mt-1 rounded-lg border-2 border-neutral-300 bg-white p-3" /></label>
          <label className="font-semibold text-neutral-700">Marital status<select value={profile.maritalStatus} onChange={(event) => update('maritalStatus', event.target.value)} className="block w-full mt-1 rounded-lg border-2 border-neutral-300 bg-white p-3"><option value="">Select</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></select></label>
          <label className="font-semibold text-neutral-700">Gender<select value={profile.gender} onChange={(event) => update('gender', event.target.value)} className="block w-full mt-1 rounded-lg border-2 border-neutral-300 bg-white p-3"><option value="">Select</option><option value="Female">Female</option><option value="Male">Male</option></select></label>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <label className="font-semibold text-neutral-700">Family member name<input type="text" value={profile.familyMemberName} onChange={(event) => update('familyMemberName', event.target.value)} className="block w-full mt-1 rounded-lg border-2 border-neutral-300 bg-white p-3" placeholder="Family member name" /></label>
          <label className="font-semibold text-neutral-700">Family member phone<input type="tel" value={profile.familyMemberPhone} onChange={(event) => update('familyMemberPhone', event.target.value)} className="block w-full mt-1 rounded-lg border-2 border-neutral-300 bg-white p-3" placeholder="Family member phone" /></label>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-calm-600 text-white px-5 py-3 font-bold"><Save className="w-5 h-5" aria-hidden="true" />Save details</button>
          {profile.familyMemberPhone && <a href={`tel:${profile.familyMemberPhone.replace(/\s/g, '')}`} className="cc-family-button"><PhoneCall className="w-5 h-5" aria-hidden="true" />Call Family Member</a>}
        </div>
        <p role="status" aria-live="polite" className="mt-3 font-semibold text-success-700">{savedMessage}</p>
      </section>
      <Memories />
    </div>
  );
}
