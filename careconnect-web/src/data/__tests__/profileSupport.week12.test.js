import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  EMPTY_PROFILE,
  PROFILE_CHANGED_EVENT,
  getExtendedProfile,
  saveExtendedProfile,
} from '../profileSupport.ts';


describe('profileSupport', () => {

  beforeEach(() => {
    localStorage.clear();
  });


  it('returns an empty profile when storage is empty', () => {
    expect(
      getExtendedProfile(),
    ).toEqual(EMPTY_PROFILE);
  });


  it('merges partial stored profile with defaults', () => {
    localStorage.setItem(
      'careconnect_extended_profile',
      JSON.stringify({
        familyMemberName: 'Maria',
        familyMemberPhone: '555 0100',
      }),
    );

    expect(
      getExtendedProfile(),
    ).toEqual({
      ...EMPTY_PROFILE,
      familyMemberName: 'Maria',
      familyMemberPhone: '555 0100',
    });
  });


  it('returns empty profile for malformed JSON', () => {
    localStorage.setItem(
      'careconnect_extended_profile',
      '{broken',
    );

    expect(
      getExtendedProfile(),
    ).toEqual(EMPTY_PROFILE);
  });


  it('saves the extended profile', () => {
    const profile = {
      dateOfBirth: '1945-01-01',
      maritalStatus: 'Married',
      gender: 'Female',
      homeAddress: '123 Main',
      familyMemberName: 'Maria',
      familyMemberPhone: '555 0100',
    };

    saveExtendedProfile(profile);

    expect(
      JSON.parse(
        localStorage.getItem(
          'careconnect_extended_profile',
        ),
      ),
    ).toEqual(profile);
  });


  it('dispatches profile changed event when saved', () => {
    const listener = jest.fn();

    window.addEventListener(
      PROFILE_CHANGED_EVENT,
      listener,
    );

    saveExtendedProfile({
      ...EMPTY_PROFILE,
      familyMemberName: 'Maria',
    });

    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(
      PROFILE_CHANGED_EVENT,
      listener,
    );
  });

});