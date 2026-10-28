/**
 * Every user-visible string on the Help screen. Facts about the app describe
 * careconnect-web only (no F1/F6/Ctrl+K: those are the Electron app's).
 * 555-0100..0199 numbers are reserved for fiction in the North American plan.
 */
export const help = {
  heading: 'Help',
  lede: 'Help is available whenever you need it.',

  emergency: {
    heading: 'In an emergency',
    icon: 'alert',
    items: [
      { id: 'call-911', title: 'Call 911',
        body: 'If you or someone with you needs urgent medical help, call 911.' },
      { id: 'call-988', title: 'Call or text 988',
        body: "If you're in emotional distress or thinking about suicide, call or text 988 to reach the 988 Suicide & Crisis Lifeline. It's free and open 24 hours a day, every day. You can also chat at 988lifeline.org." },
    ],
    notForEmergencies: 'Messages are not for emergencies. Your care team may not read a message until the next working day.',
    outsideUs: 'Outside the United States, call your local emergency number.',
  },

  // CareTeamCard renders patientToday.careTeam; these go in its new children slot.
  contact: {
    hours: 'Messages are read Monday to Friday, 8:00 am to 6:00 pm. We usually reply within one working day.',
    phoneLead: 'To talk to someone, call:',
    phones: [
      { id: 'greenfield', label: 'Greenfield Surgery', number: '555-0142' },
      { id: 'maria', label: 'Maria Thompson, your daughter', number: '555-0187' },
    ],
    doseNote: 'Questions about a dose? Your caregiver can help.',
  },

  usingApp: {
    heading: 'Using CareConnect',
    keyboard: {
      heading: 'Getting around with a keyboard',
      caption: 'Keyboard keys',
      columns: ['Keys', 'What they do'],
      rows: [
        { id: 'tab', keys: ['Tab'], spoken: 'Tab', action: 'Move to the next link, button or box' },
        { id: 'shift-tab', keys: ['Shift', 'Tab'], spoken: 'Shift and Tab', action: 'Move back' },
        { id: 'enter', keys: ['Enter'], spoken: 'Enter', action: 'Open a link, or press a button' },
        { id: 'space', keys: ['Space'], spoken: 'Space', action: 'Press a button, or open and close a question below' },
        { id: 'arrows', keys: ['Arrow keys'], spoken: 'Arrow keys', action: 'Choose who a new message is for' },
        { id: 'zoom-in', keys: ['Ctrl', '+'], spoken: 'Control and plus, or Command and plus on a Mac', action: 'Make everything bigger' },
        { id: 'zoom-out', keys: ['Ctrl', '-'], spoken: 'Control and minus, or Command and minus on a Mac', action: 'Make everything smaller' },
      ],
      notes: [
        'The first time you press Tab on a page, a Skip to main content link appears. Press Enter to jump past the menu.',
        'A dark outline shows which link or button you are on.',
      ],
    },
    accessibility: {
      heading: 'Accessibility',
      points: [
        'CareConnect is designed to meet WCAG 2.1 level AA.',
        'It works with screen readers. Every page has a main heading, a labelled menu and a Skip to main content link.',
        'You can make text bigger, and the page rearranges itself so nothing is cut off.',
        'Nothing relies on colour alone. Words such as New and Sent say what has happened.',
        'If your device is set to reduce motion or to use high-contrast colours, CareConnect follows it.',
      ],
    },
    install: {
      heading: 'Install CareConnect',
      steps: [
        'On a computer, in Chrome or Edge, open the browser menu and choose Install.',
        'On iPhone or iPad, in Safari, tap Share, then Add to Home Screen.',
        'On Android, in Chrome, open the menu and choose Install app or Add to Home screen.',
      ],
    },
    offline: {
      heading: 'Using CareConnect without the internet',
      body: 'Once CareConnect has opened, it keeps working without an internet connection. Your messages are kept on this device.',
    },
  },

  faq: {
    heading: 'Common questions',
    items: [
      { id: 'reply-time', question: 'When will my care team reply?',
        answer: "Usually within one working day. Messages are read Monday to Friday, 8:00 am to 6:00 pm. If it's urgent, call Greenfield Surgery on 555-0142. In an emergency, call 911." },
      { id: 'new-message', question: 'How do I know I have a new message?',
        answer: 'Messages in the menu shows a number, and new messages say New in your list.' },
      { id: 'was-sent', question: 'How do I know my message was sent?',
        answer: 'It appears at the bottom of the conversation, marked Sent, with the time.' },
      { id: 'read-again', question: 'Can I read a message again?',
        answer: 'Yes. Messages stay in your list after you read them. Nothing is deleted.' },
      { id: 'what-can-i-do', question: 'What can I do in CareConnect?',
        answer: 'View your day, take medicines, and join appointments with your care team. You can also message your care team and your family.' },
    ],
  },

  privacy: {
    heading: 'Your privacy',
    points: [
      'Your information is private and secure.',
      'This is a demonstration. Joyce Harper, her care team and every message are made up.',
      'In this demo, sending is simulated. Messages are saved in this browser only and never leave this device. There is no account or sign-in.',
      "CareConnect doesn't use cookies or analytics.",
    ],
    // D2: one reset puts back the whole demo, not only the messages.
    reset: {
      heading: 'Start the demo again',
      action: 'Reset the demo',
      helper: 'Puts back the original medicines, appointments and four conversations, with two marked New. Anything you marked or sent is removed.',
    },
  },
};
