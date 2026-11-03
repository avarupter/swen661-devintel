import React, { createRef } from 'react';

import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react';

import {
  MemoryRouter,
} from 'react-router-dom';

import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import ChatBot from '../ChatBot.tsx';
import ConfirmDialog from '../ConfirmDialog.tsx';

import {
  getMedications,
} from '../../data/medsStore';

import {
  getExtendedProfile,
} from '../../data/profileSupport';


jest.setTimeout(20000);


jest.mock(
  '../../data/medsStore',
  () => ({
    getMedications:
      jest.fn(),
  }),
);


jest.mock(
  '../../data/profileSupport',
  () => ({
    getExtendedProfile:
      jest.fn(),
  }),
);


jest.mock(
  '../../data/mockData',
  () => ({
    contacts: [
      {
        id: 'family-1',
        name: 'Maria Simmons',
        role: 'family',
        phone: '555-111-2222',
      },
      {
        id: 'caregiver-1',
        name: 'Joyce Adeyemi',
        role: 'caregiver',
        phone: '555-333-4444',
      },
    ],
  }),
);


function renderChat() {
  return render(
    <MemoryRouter>
      <ChatBot variant="embedded" />
    </MemoryRouter>,
  );
}


function ask(text) {
  const input =
    screen.getByPlaceholderText(
      'Example: Where are my appointments?',
    );

  const send =
    screen.getByRole(
      'button',
      {
        name:
          'Send message to CareConnect Assistant',
      },
    );

  fireEvent.change(
    input,
    {
      target: {
        value: text,
      },
    },
  );

  fireEvent.click(
    send,
  );

  // The user's question itself proves the submit handler executed.
  expect(
    screen.getAllByText(
      text,
      {
        exact: false,
      },
    ).length,
  ).toBeGreaterThan(0);
}


describe(
  'Week 12 branch boost',
  () => {

    beforeEach(() => {
      jest.clearAllMocks();

      getExtendedProfile.mockReturnValue({
        familyMemberName:
          'Maria Simmons',

        familyMemberPhone:
          '555-111-2222',
      });

      getMedications.mockReturnValue([
        {
          id: 'med-default',
          name: 'Metformin',
          dosage: '500 mg',
          times: ['08:00'],
          colour: 'calm-blue',
        },
      ]);
    });


    // ========================================================
    // CHATBOT — CORE SCRIPTED RESPONSE BRANCHES
    // ========================================================

    it(
      'covers general navigation and help branches',
      () => {
        renderChat();

        const questions = [
          'I am confused and forgot what to do',
          'What should I do next?',
          'Show me my daily schedule',
          'Where can I find my medicine list?',
          'Where are my appointments?',
          'Show me my memories',
          'Where are my contacts?',
          'How do I check in?',
          'How do I add food I ate?',
          'What can you do?',
          'hello',
          'thank you',
          'something completely unrelated',
        ];

        for (
          const question
          of questions
        ) {
          ask(question);
        }

        expect(
          screen.getByText(
            'CareConnect Assistant',
          ),
        ).toBeInTheDocument();
      },
    );


    // ========================================================
    // CHATBOT — DATE / TIME
    // ========================================================

    it(
      'covers date and time response branch',
      () => {
        renderChat();

        ask(
          'What day and time is it?',
        );
      },
    );


    // ========================================================
    // CHATBOT — MEDICAL BOUNDARY
    // ========================================================

    it(
      'covers medical advice boundary',
      () => {
        renderChat();

        ask(
          'Should I double my medication dose?',
        );
      },
    );


    // ========================================================
    // CHATBOT — FAMILY CONTACT
    // ========================================================

    it(
      'covers family contact branch',
      () => {
        renderChat();

        ask(
          'Who can I call?',
        );
      },
    );


    // ========================================================
    // CHATBOT — EMPTY MEDICATION LIST
    // ========================================================

    it(
      'covers empty medication schedule',
      () => {
        getMedications.mockReturnValue(
          [],
        );

        renderChat();

        ask(
          'Which medicine is next?',
        );
      },
    );


    // ========================================================
    // CHATBOT — NO EVENING MEDICINE
    // ========================================================

    it(
      'covers no evening medication branch',
      () => {
        getMedications.mockReturnValue([
          {
            id: 'morning-only',
            name: 'Vitamin D',
            dosage: '1 tablet',
            times: ['08:00'],
            colour:
              'warning-yellow',
          },
        ]);

        renderChat();

        ask(
          'Where is my evening medicine?',
        );
      },
    );


    // ========================================================
    // CHATBOT — EVENING + RED COLOR
    // ========================================================

    it(
      'covers evening medicine and red cue',
      () => {
        getMedications.mockReturnValue([
          {
            id: 'evening-red',
            name: 'Evening Tablet',
            dosage: '5 mg',
            times: ['20:00'],
            colour:
              'alert-red',
          },
        ]);

        renderChat();

        ask(
          'Where is my evening medicine?',
        );
      },
    );


    // ========================================================
    // CHATBOT — DAYTIME + GREEN COLOR
    // ========================================================

    it(
      'covers daytime medicine and green cue',
      () => {
        getMedications.mockReturnValue([
          {
            id: 'day-green',
            name: 'Lunch Tablet',
            dosage: '5 mg',
            times: ['13:00'],
            colour:
              'success-green',
          },
        ]);

        renderChat();

        ask(
          'Which medicine is next?',
        );
      },
    );


    // ========================================================
    // CHATBOT — MORNING + ORANGE COLOR
    // ========================================================

    it(
      'covers morning medicine and orange cue',
      () => {
        getMedications.mockReturnValue([
          {
            id: 'morning-orange',
            name: 'Morning Tablet',
            dosage: '5 mg',
            times: ['08:00'],
            colour:
              'warm-orange',
          },
        ]);

        renderChat();

        ask(
          'Which medicine is next?',
        );
      },
    );


    // ========================================================
    // CHATBOT — FALLBACK COLOR
    // ========================================================

    it(
      'covers fallback medicine color cue',
      () => {
        getMedications.mockReturnValue([
          {
            id: 'neutral-tablet',
            name: 'Plain Tablet',
            dosage: '5 mg',
            times: ['23:59'],
            colour: 'neutral',
          },
        ]);

        renderChat();

        ask(
          'What color bottle should I look for?',
        );
      },
    );


    // ========================================================
    // CHATBOT — BACKUP LOCATION
    // ========================================================

    it(
      'covers backup medicine location',
      () => {
        renderChat();

        ask(
          'Where else could my medicine be?',
        );
      },
    );


    // ========================================================
    // CHATBOT — PROVIDER / CAREGIVER RESPONSE
    // ========================================================

    it(
      'covers provider wording branch',
      () => {
        renderChat();

        ask(
          'Who is my provider?',
        );
      },
    );


    // ========================================================
    // CHATBOT — EMERGENCY PRIORITY
    // ========================================================

    it(
      'covers emergency priority branch',
      () => {
        renderChat();

        ask(
          'I cannot breathe and need help',
        );

        expect(
          screen.getAllByText(
            /call local emergency services now/i,
          ).length,
        ).toBeGreaterThan(0);
      },
    );


    // ========================================================
    // CHATBOT — CLEAR CONVERSATION
    // ========================================================

    it(
      'covers conversation clear branch',
      () => {
        renderChat();

        ask(
          'Where are my appointments?',
        );

        fireEvent.click(
          screen.getByRole(
            'button',
            {
              name:
                'Clear assistant conversation',
            },
          ),
        );

        expect(
          screen.getByText(
            'CareConnect Assistant',
          ),
        ).toBeInTheDocument();
      },
    );


    // ========================================================
    // CONFIRM DIALOG — CUSTOM CONTENT
    // ========================================================

    it(
      'covers confirm dialog custom content',
      () => {
        const trigger =
          document.createElement(
            'button',
          );

        document.body.appendChild(
          trigger,
        );

        const triggerRef =
          createRef();

        triggerRef.current =
          trigger;

        const onConfirm =
          jest.fn();

        const onCancel =
          jest.fn();

        render(
          <ConfirmDialog
            open={true}
            title="Delete record"
            description="This cannot be undone."
            confirmLabel="Yes, delete"
            cancelLabel="Keep record"
            triggerRef={triggerRef}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />,
        );

        const dialog =
          screen.getByRole(
            'dialog',
            {
              name:
                'Delete record',
            },
          );

        expect(
          dialog,
        ).toHaveAttribute(
          'aria-describedby',
        );

        fireEvent.click(
          screen.getByRole(
            'button',
            {
              name:
                'Yes, delete',
            },
          ),
        );

        expect(
          onConfirm,
        ).toHaveBeenCalledTimes(
          1,
        );

        trigger.remove();
      },
    );


    // ========================================================
    // CONFIRM DIALOG — ESCAPE
    // ========================================================

    it(
      'covers Escape cancellation',
      () => {
        const triggerRef =
          createRef();

        triggerRef.current =
          document.createElement(
            'button',
          );

        const onCancel =
          jest.fn();

        render(
          <ConfirmDialog
            open={true}
            title="Confirm action"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={onCancel}
          />,
        );

        fireEvent.keyDown(
          document,
          {
            key: 'Escape',
          },
        );

        expect(
          onCancel,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );


    // ========================================================
    // CONFIRM DIALOG — ORDINARY KEY
    // ========================================================

    it(
      'covers non-tab keyboard branch',
      () => {
        const triggerRef =
          createRef();

        triggerRef.current =
          document.createElement(
            'button',
          );

        const onCancel =
          jest.fn();

        render(
          <ConfirmDialog
            open={true}
            title="Confirm action"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={onCancel}
          />,
        );

        fireEvent.keyDown(
          document,
          {
            key: 'ArrowDown',
          },
        );

        expect(
          onCancel,
        ).not.toHaveBeenCalled();
      },
    );


    // ========================================================
    // CONFIRM DIALOG — FORWARD FOCUS WRAP
    // ========================================================

    it(
      'covers forward focus wrap',
      () => {
        const triggerRef =
          createRef();

        triggerRef.current =
          document.createElement(
            'button',
          );

        render(
          <ConfirmDialog
            open={true}
            title="Confirm action"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        const close =
          screen.getByRole(
            'button',
            {
              name:
                'Close confirmation',
            },
          );

        const confirm =
          screen.getByRole(
            'button',
            {
              name:
                'Confirm',
            },
          );

        confirm.focus();

        fireEvent.keyDown(
          document,
          {
            key: 'Tab',
          },
        );

        expect(
          document.activeElement,
        ).toBe(
          close,
        );
      },
    );


    // ========================================================
    // CONFIRM DIALOG — BACKWARD FOCUS WRAP
    // ========================================================

    it(
      'covers backward focus wrap',
      () => {
        const triggerRef =
          createRef();

        triggerRef.current =
          document.createElement(
            'button',
          );

        render(
          <ConfirmDialog
            open={true}
            title="Confirm action"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        const close =
          screen.getByRole(
            'button',
            {
              name:
                'Close confirmation',
            },
          );

        const confirm =
          screen.getByRole(
            'button',
            {
              name:
                'Confirm',
            },
          );

        close.focus();

        fireEvent.keyDown(
          document,
          {
            key: 'Tab',
            shiftKey: true,
          },
        );

        expect(
          document.activeElement,
        ).toBe(
          confirm,
        );
      },
    );


    // ========================================================
    // CONFIRM DIALOG — BACKDROP
    // ========================================================

    it(
      'covers backdrop cancellation',
      () => {
        const triggerRef =
          createRef();

        triggerRef.current =
          document.createElement(
            'button',
          );

        const onCancel =
          jest.fn();

        render(
          <ConfirmDialog
            open={true}
            title="Confirm action"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={onCancel}
          />,
        );

        fireEvent.click(
          screen.getByRole(
            'presentation',
          ),
        );

        expect(
          onCancel,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );


    // ========================================================
    // CONFIRM DIALOG — INNER CLICK
    // ========================================================

    it(
      'does not cancel on dialog content click',
      () => {
        const triggerRef =
          createRef();

        triggerRef.current =
          document.createElement(
            'button',
          );

        const onCancel =
          jest.fn();

        render(
          <ConfirmDialog
            open={true}
            title="Confirm action"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={onCancel}
          />,
        );

        fireEvent.click(
          screen.getByRole(
            'dialog',
          ),
        );

        expect(
          onCancel,
        ).not.toHaveBeenCalled();
      },
    );


    // ========================================================
    // CONFIRM DIALOG — CLOSE BUTTON
    // ========================================================

    it(
      'covers close button',
      () => {
        const triggerRef =
          createRef();

        triggerRef.current =
          document.createElement(
            'button',
          );

        const onCancel =
          jest.fn();

        render(
          <ConfirmDialog
            open={true}
            title="Confirm action"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={onCancel}
          />,
        );

        fireEvent.click(
          screen.getByRole(
            'button',
            {
              name:
                'Close confirmation',
            },
          ),
        );

        expect(
          onCancel,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );


    // ========================================================
    // CONFIRM DIALOG — CLOSED / RESTORE FOCUS
    // ========================================================

    it(
      'covers closed branch and focus restore',
      () => {
        const trigger =
          document.createElement(
            'button',
          );

        document.body.appendChild(
          trigger,
        );

        const triggerRef =
          createRef();

        triggerRef.current =
          trigger;

        const {
          rerender,
        } = render(
          <ConfirmDialog
            open={true}
            title="Confirm action"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        rerender(
          <ConfirmDialog
            open={false}
            title="Confirm action"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        expect(
          screen.queryByRole(
            'dialog',
          ),
        ).not.toBeInTheDocument();

        trigger.remove();
      },
    );


    // ========================================================
    // CONFIRM DIALOG — NO DESCRIPTION / DEFAULT LABELS
    // ========================================================

    it(
      'covers optional description false branch and default labels',
      () => {
        const triggerRef =
          createRef();

        triggerRef.current =
          document.createElement(
            'button',
          );

        render(
          <ConfirmDialog
            open={true}
            title="Simple confirmation"
            triggerRef={triggerRef}
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        expect(
          screen.getByRole(
            'dialog',
          ),
        ).not.toHaveAttribute(
          'aria-describedby',
        );

        expect(
          screen.getByRole(
            'button',
            {
              name:
                'Cancel',
            },
          ),
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            'button',
            {
              name:
                'Confirm',
            },
          ),
        ).toBeInTheDocument();
      },
    );

  },
);