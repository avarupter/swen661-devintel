export interface ExtendedProfile {
  dateOfBirth: string;
  maritalStatus: string;
  gender: string;
  homeAddress: string;
  familyMemberName: string;
  familyMemberPhone: string;
}

const PROFILE_KEY =
  'careconnect_extended_profile';

export const PROFILE_CHANGED_EVENT =
  'careconnect:profile-changed';

export const EMPTY_PROFILE: ExtendedProfile = {
  dateOfBirth: '',
  maritalStatus: '',
  gender: '',
  homeAddress: '',
  familyMemberName: '',
  familyMemberPhone: '',
};

export function getExtendedProfile(): ExtendedProfile {
  try {
    const raw =
      localStorage.getItem(
        PROFILE_KEY,
      );

    if (!raw) {
      return {
        ...EMPTY_PROFILE,
      };
    }

    const stored =
      JSON.parse(
        raw,
      ) as Partial<ExtendedProfile>;

    return {
      ...EMPTY_PROFILE,
      ...stored,
    };
  } catch {
    return {
      ...EMPTY_PROFILE,
    };
  }
}

export function saveExtendedProfile(
  profile: ExtendedProfile,
): void {
  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify(profile),
  );

  window.dispatchEvent(
    new Event(
      PROFILE_CHANGED_EVENT,
    ),
  );
}