import type {
  ScheduleItem,
  Medication,
  MemoryCard,
  Contact,
  CaregiverNote,
} from '../types';

const TODAY = new Date().toISOString().split('T')[0];

// ── Daily Schedule ─────────────────────────────────────────────────────────

export const scheduleItems: ScheduleItem[] = [
  { id: 's1', time: '07:30', label: 'Wake up & stretch', category: 'activity', done: true },
  { id: 's2', time: '08:00', label: 'Breakfast', description: 'Oatmeal with berries', category: 'meal', done: true },
  { id: 's3', time: '08:30', label: 'Morning medications', description: 'Take with a full glass of water', category: 'medication', done: true },
  { id: 's4', time: '10:00', label: 'Walk in the garden', description: '20 minutes of fresh air', category: 'activity', done: false },
  { id: 's5', time: '12:00', label: 'Lunch', description: 'Chicken soup and bread roll', category: 'meal', done: false },
  { id: 's6', time: '13:00', label: 'Rest time', description: 'Lie down or read quietly', category: 'rest', done: false },
  { id: 's7', time: '15:00', label: 'Video call with Maria', description: 'Your daughter — she will call you', category: 'appointment', done: false },
  { id: 's8', time: '17:30', label: 'Evening medications', category: 'medication', done: false },
  { id: 's9', time: '18:00', label: 'Dinner', description: 'Pasta with tomato sauce', category: 'meal', done: false },
  { id: 's10', time: '20:30', label: 'Bedtime', description: 'Lights out, good night!', category: 'rest', done: false },
];

// ── Medications ────────────────────────────────────────────────────────────

export const medications: Medication[] = [
  {
    id: 'm1',
    name: 'Amlodipine',
    dosage: '5 mg — 1 tablet',
    times: ['08:30'],
    instructions: 'Take with food.',
    colour: 'bg-calm-200',
    taken: { [TODAY]: true },
  },
  {
    id: 'm2',
    name: 'Atorvastatin',
    dosage: '20 mg — 1 tablet',
    times: ['20:00'],
    instructions: 'Take in the evening.',
    colour: 'bg-warm-200',
    taken: { [TODAY]: false },
  },
  {
    id: 'm3',
    name: 'Sertraline',
    dosage: '50 mg — 1 tablet',
    times: ['08:30'],
    instructions: 'Take with or without food.',
    colour: 'bg-success-200',
    taken: { [TODAY]: true },
  },
  {
    id: 'm4',
    name: 'Vitamin D3',
    dosage: '1000 IU — 1 capsule',
    times: ['08:30'],
    instructions: 'Take with breakfast.',
    colour: 'bg-warning-200',
    taken: { [TODAY]: false },
  },
];

// ── Memory Cards ────────────────────────────────────────────────────────────

export const memoryCards: MemoryCard[] = [
  {
    id: 'mc1',
    title: 'Maria — Your Daughter',
    body: 'Maria lives in Bristol with her husband Tom and your two grandchildren, Ella (8) and James (5). She calls every Tuesday and Sunday afternoon.',
    imageUrl: 'https://images.pexels.com/photos/3807571/pexels-photo-3807571.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'family',
    pinned: true,
  },
  {
    id: 'mc2',
    title: 'Your Home',
    body: 'You live at 14 Meadow Lane. The front door key is hanging on the blue hook by the kitchen. Your bedroom is the first door on the left upstairs.',
    imageUrl: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'place',
    pinned: true,
  },
  {
    id: 'mc3',
    title: 'Your Garden',
    body: 'You love spending time in your garden. You grow tomatoes, sweet peas, and sunflowers every summer. Your favourite bench is by the rose bush.',
    imageUrl: 'https://images.pexels.com/photos/1084188/pexels-photo-1084188.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'hobby',
    pinned: false,
  },
  {
    id: 'mc4',
    title: 'Buddy — Your Cat',
    body: 'Buddy is a ginger tabby cat, 4 years old. He eats twice a day — morning and evening. His food is in the blue tin under the kitchen sink.',
    imageUrl: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'pet',
    pinned: true,
  },
  {
    id: 'mc5',
    title: '50th Wedding Anniversary',
    body: 'You and Robert celebrated your golden anniversary in June 2018 with a party at the village hall. Over 60 friends and family came to celebrate.',
    imageUrl: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'event',
    pinned: false,
  },
  {
    id: 'mc6',
    title: 'Favourite Walk — River Path',
    body: 'The river path starts at the end of Meadow Lane. It is a flat, 20-minute loop through the meadow and back. You used to walk it every morning.',
    imageUrl: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'place',
    pinned: false,
  },
];

// ── Contacts ────────────────────────────────────────────────────────────────

export const contacts: Contact[] = [
  {
    id: 'c1',
    name: 'Maria Thompson',
    role: 'family',
    phone: '07700 900 123',
    avatarInitials: 'MT',
    avatarColour: 'bg-calm-500',
    notes: 'Your daughter. Calls every Tuesday and Sunday.',
    isEmergency: true,
  },
  {
    id: 'c2',
    name: 'Joyce Adeyemi',
    role: 'caregiver',
    phone: '07700 900 456',
    avatarInitials: 'JA',
    avatarColour: 'bg-success-600',
    notes: 'Your daytime carer. Visits Monday to Friday, 9am–1pm.',
    isEmergency: true,
  },
  {
    id: 'c3',
    name: 'Dr. Priya Sharma',
    role: 'doctor',
    phone: '01234 567 890',
    avatarInitials: 'PS',
    avatarColour: 'bg-warm-600',
    notes: 'Your GP at the Greenfield Surgery. Call for appointments.',
    isEmergency: false,
  },
  {
    id: 'c4',
    name: 'Tom Thompson',
    role: 'family',
    phone: '07700 900 789',
    avatarInitials: 'TT',
    avatarColour: 'bg-calm-700',
    notes: "Maria's husband. Can help in emergencies.",
    isEmergency: false,
  },
  {
    id: 'c5',
    name: 'Emergency Services',
    role: 'emergency',
    phone: '999',
    avatarInitials: '!',
    avatarColour: 'bg-alert-600',
    notes: 'Call 999 for police, fire, or ambulance.',
    isEmergency: true,
  },
];

// ── Caregiver Notes ─────────────────────────────────────────────────────────

export const caregiverNotes: CaregiverNote[] = [
  {
    id: 'n1',
    date: TODAY,
    author: 'Joyce Adeyemi',
    note: 'Good morning. Dorothy had a restful night. She ate all of her breakfast and took morning meds without difficulty. Mood is cheerful.',
    priority: 'low',
  },
  {
    id: 'n2',
    date: TODAY,
    author: 'Joyce Adeyemi',
    note: 'Dorothy mentioned her left knee is a little sore today. She skipped the garden walk but did 10 minutes of gentle seated exercises instead. Worth noting for the GP review next week.',
    priority: 'medium',
  },
  {
    id: 'n3',
    date: '2026-06-03',
    author: 'Maria Thompson',
    note: "Had a lovely video call with Mum yesterday. She remembered Ella's school play and was asking about the cat. Great day overall.",
    priority: 'low',
  },
  {
    id: 'n4',
    date: '2026-06-02',
    author: 'Joyce Adeyemi',
    note: 'Dorothy was confused about the day of the week this morning and asked for Robert twice. Gently reminded her and she settled quickly. No distress. Monitoring.',
    priority: 'medium',
  },
];
