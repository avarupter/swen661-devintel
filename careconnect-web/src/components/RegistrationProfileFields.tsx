import { useState } from 'react';
import {
  getExtendedProfile,
  saveExtendedProfile,
} from '../data/profileSupport';

export default function RegistrationProfileFields() {
  const [profile, setProfile] = useState(getExtendedProfile);

  function update(
    field: 'dateOfBirth' | 'maritalStatus' | 'gender',
    value: string,
  ) {
    const next = { ...profile, [field]: value };
    setProfile(next);
    saveExtendedProfile(next);
  }

  return (
    <fieldset className="rounded-xl border-2 border-calm-200 bg-calm-50 p-4 space-y-4">
      <legend className="px-2 font-bold text-neutral-800">Personal information</legend>
      <p className="text-sm text-neutral-600">These details will also appear in your About Me profile.</p>

      <label className="block font-semibold text-neutral-700">
        Date of birth
        <input type="date" value={profile.dateOfBirth} onChange={(event) => update('dateOfBirth', event.target.value)} className="mt-1 block w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-3" />
      </label>

      <label className="block font-semibold text-neutral-700">
        Marital status
        <select value={profile.maritalStatus} onChange={(event) => update('maritalStatus', event.target.value)} className="mt-1 block w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-3">
          <option value="">Select</option>
          <option value="Single">Single</option>
          <option value="Married">Married</option>
          <option value="Divorced">Divorced</option>
          <option value="Widowed">Widowed</option>
        </select>
      </label>

      <label className="block font-semibold text-neutral-700">
        Gender
        <select value={profile.gender} onChange={(event) => update('gender', event.target.value)} className="mt-1 block w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-3">
          <option value="">Select</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
        </select>
      </label>
    </fieldset>
  );
}
