import {
  useMemo,
  useState,
} from 'react';

import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  Info,
  List,
  MapPin,
  Phone,
  PlusCircle,
  User2,
  type LucideIcon,
} from 'lucide-react';

import { Card } from '../components';
import {
  getAppointments,
  saveAppointments,
} from '../data/apptStore';

import type {
  Appointment,
  AppointmentLocationType,
} from '../data/appointmentsData';

type ViewMode = 'list' | 'calendar';

const LOCATION_ICON: Record<
  AppointmentLocationType,
  LucideIcon
> = {
  clinic: MapPin,
  hospital: Building2,
  telephone: Phone,
  home: Home,
};

const LOCATION_LABEL: Record<
  AppointmentLocationType,
  string
> = {
  clinic: 'Clinic visit',
  hospital: 'Hospital visit',
  telephone: 'Telephone — no travel needed',
  home: 'Home visit — they come to you',
};

const WEEK_DAYS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  return new Date(
    `${value}T12:00:00`,
  );
}

function formatTime(time: string) {
  const [hour, minute] =
    time.split(':').map(Number);

  const suffix =
    hour >= 12 ? 'pm' : 'am';

  return `${hour % 12 || 12}:${String(
    minute,
  ).padStart(2, '0')} ${suffix}`;
}

function formatDate(value: string) {
  return parseDate(
    value,
  ).toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    },
  );
}

function diffDays(
  start: string,
  end: string,
) {
  return Math.round(
    (
      parseDate(end).getTime() -
      parseDate(start).getTime()
    ) / 86_400_000,
  );
}

function sortAppointments(
  a: Appointment,
  b: Appointment,
) {
  if (a.date !== b.date) {
    return a.date < b.date
      ? -1
      : 1;
  }

  return a.time < b.time
    ? -1
    : 1;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(
    'en-US',
    {
      month: 'long',
      year: 'numeric',
    },
  );
}

function changeMonth(
  date: Date,
  amount: number,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + amount,
    1,
    12,
  );
}

function calendarDays(month: Date) {
  const first =
    new Date(
      month.getFullYear(),
      month.getMonth(),
      1,
      12,
    );

  const start =
    new Date(first);

  start.setDate(
    first.getDate() -
      first.getDay(),
  );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const day =
        new Date(start);

      day.setDate(
        start.getDate() +
          index,
      );

      return day;
    },
  );
}

function AppointmentCard({
  appointment,
  today,
  onAdd,
}: {
  appointment: Appointment;
  today: string;
  onAdd: (
    appointment: Appointment,
  ) => void;
}) {
  const Icon =
    LOCATION_ICON[
      appointment.location.type
    ];

  const physicalLocation =
    appointment.location.type !==
      'telephone' &&
    appointment.location.type !==
      'home' &&
    Boolean(
      appointment.location.address,
    );

  const directionsUrl =
    physicalLocation
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${appointment.location.name}, ${appointment.location.address}`,
        )}`
      : '';

  return (
    <Card
      heading={appointment.title}
      headingLevel={3}
      className={
        appointment.date === today
          ? 'border-calm-300'
          : ''
      }
      actions={
        appointment.date === today ? (
          <span className="inline-flex items-center gap-1.5 bg-calm-100 text-calm-700 text-sm font-bold px-3 py-1 rounded-pill">
            <CalendarDays
              className="w-4 h-4"
              aria-hidden="true"
            />
            Today
          </span>
        ) : undefined
      }
    >
      <div className="space-y-4">

        <div className="flex items-start gap-3">
          <Clock
            className="w-5 h-5 text-neutral-500 flex-shrink-0"
            aria-hidden="true"
          />

          <time
            dateTime={`${appointment.date}T${appointment.time}`}
            className="font-bold text-neutral-800"
          >
            {formatDate(
              appointment.date,
            )}{' '}
            —{' '}
            {formatTime(
              appointment.time,
            )}
          </time>
        </div>

        <div className="flex items-start gap-3">
          <Icon
            className="w-5 h-5 text-calm-600 flex-shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="font-semibold text-neutral-800">
              {
                appointment.location
                  .name
              }
            </p>

            {appointment.location
              .address && (
              <p className="text-sm text-neutral-500 mt-1">
                {
                  appointment
                    .location.address
                }
              </p>
            )}

            <p className="text-sm text-neutral-500 mt-1">
              {
                LOCATION_LABEL[
                  appointment.location
                    .type
                ]
              }
            </p>
          </div>
        </div>

        {appointment.caregiver && (
          <div className="flex items-center gap-3 rounded-xl bg-success-50 border border-success-200 p-3">
            <User2
              className="w-5 h-5 text-success-700"
              aria-hidden="true"
            />

            <p className="text-success-800">
              {
                appointment
                  .caregiver
                  .split(' ')[0]
              }{' '}
              is taking you to
              this appointment.
            </p>
          </div>
        )}

        {appointment.notes && (
          <div className="flex items-start gap-3 rounded-xl bg-neutral-50 border border-neutral-200 p-3">
            <Info
              className="w-5 h-5 text-neutral-500"
              aria-hidden="true"
            />

            <p className="text-neutral-700">
              {appointment.notes}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-neutral-100">

          {physicalLocation ? (
            <button
              type="button"
              onClick={() =>
                window.open(
                  directionsUrl,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
              className="inline-flex items-center gap-2 rounded-lg border-2 border-neutral-300 px-4 py-2.5 font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <MapPin
                className="w-4 h-4"
                aria-hidden="true"
              />
              Get directions
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 px-3 py-2 text-sm font-semibold text-success-700">
              <CheckCircle2
                className="w-4 h-4"
                aria-hidden="true"
              />
              No travel needed
            </span>
          )}

          <div className="ml-auto">
            {appointment.isInMyDay ? (
              <span className="inline-flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 px-3 py-2 text-sm font-bold text-success-700">
                <CheckCircle2
                  className="w-4 h-4"
                  aria-hidden="true"
                />
                In My Day
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onAdd(
                    appointment,
                  )
                }
                className="inline-flex items-center gap-2 rounded-lg bg-calm-50 border-2 border-calm-300 px-3 py-2 text-sm font-semibold text-calm-700 hover:bg-calm-100"
              >
                <PlusCircle
                  className="w-4 h-4"
                  aria-hidden="true"
                />
                Add to My Day
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Appointments() {
  const today =
    dateKey(new Date());

  const [
    appointments,
    setAppointments,
  ] = useState<Appointment[]>(
    getAppointments,
  );

  const [view, setView] =
    useState<ViewMode>('list');

  const nextAppointment =
    useMemo(
      () =>
        [...appointments]
          .filter(
            (appointment) =>
              diffDays(
                today,
                appointment.date,
              ) >= 0,
          )
          .sort(
            sortAppointments,
          )[0],
      [appointments, today],
    );

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    nextAppointment?.date ??
      today,
  );

  const [
    visibleMonth,
    setVisibleMonth,
  ] = useState(() => {
    const start =
      parseDate(
        nextAppointment?.date ??
          today,
      );

    return new Date(
      start.getFullYear(),
      start.getMonth(),
      1,
      12,
    );
  });

  const [
    announcement,
    setAnnouncement,
  ] = useState('');

  const futureAppointments =
    useMemo(
      () =>
        [...appointments]
          .filter(
            (appointment) =>
              diffDays(
                today,
                appointment.date,
              ) >= 0,
          )
          .sort(
            sortAppointments,
          ),
      [appointments, today],
    );

  const appointmentsByDate =
    useMemo(() => {
      const map =
        new Map<
          string,
          Appointment[]
        >();

      appointments.forEach(
        (appointment) => {
          const existing =
            map.get(
              appointment.date,
            ) ?? [];

          map.set(
            appointment.date,
            [
              ...existing,
              appointment,
            ],
          );
        },
      );

      return map;
    }, [appointments]);

  function addToMyDay(
    appointment: Appointment,
  ) {
    const updated =
      appointments.map(
        (item) =>
          item.id ===
          appointment.id
            ? {
                ...item,
                isInMyDay: true,
              }
            : item,
      );

    setAppointments(updated);
    saveAppointments(updated);

    setAnnouncement(
      `${appointment.title} was added to My Day.`,
    );
  }

  const todayGroup =
    futureAppointments.filter(
      (appointment) =>
        appointment.date ===
        today,
    );

  const weekGroup =
    futureAppointments.filter(
      (appointment) => {
        const days =
          diffDays(
            today,
            appointment.date,
          );

        return (
          days >= 1 &&
          days <= 6
        );
      },
    );

  const laterGroup =
    futureAppointments.filter(
      (appointment) =>
        diffDays(
          today,
          appointment.date,
        ) >= 7,
    );

  function renderGroup(
    title: string,
    group: Appointment[],
  ) {
    if (!group.length) {
      return null;
    }

    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-800">
          {title}
        </h2>

        {group.map(
          (appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={
                appointment
              }
              today={today}
              onAdd={
                addToMyDay
              }
            />
          ),
        )}
      </section>
    );
  }

  const days =
    calendarDays(
      visibleMonth,
    );

  const selectedAppointments =
    [
      ...(
        appointmentsByDate.get(
          selectedDate,
        ) ?? []
      ),
    ].sort(
      sortAppointments,
    );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-neutral-800">
            My Appointments
          </h1>

          <p className="mt-1 text-neutral-500">
            View visits and calls
            as a list or calendar.
          </p>
        </div>

        <div
          role="group"
          aria-label="Appointment view"
          className="inline-flex self-start rounded-xl border-2 border-neutral-200 bg-white p-1"
        >
          <button
            type="button"
            onClick={() =>
              setView('list')
            }
            aria-pressed={
              view === 'list'
            }
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold ${
              view === 'list'
                ? 'bg-calm-600 text-white'
                : 'text-neutral-600'
            }`}
          >
            <List
              className="w-5 h-5"
              aria-hidden="true"
            />
            List
          </button>

          <button
            type="button"
            onClick={() =>
              setView(
                'calendar',
              )
            }
            aria-pressed={
              view === 'calendar'
            }
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold ${
              view === 'calendar'
                ? 'bg-calm-600 text-white'
                : 'text-neutral-600'
            }`}
          >
            <CalendarDays
              className="w-5 h-5"
              aria-hidden="true"
            />
            Calendar
          </button>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
      >
        {announcement && (
          <div className="rounded-xl border-2 border-success-200 bg-success-50 px-4 py-3 text-success-800 font-semibold">
            {announcement}
          </div>
        )}
      </div>

      {view === 'list' ? (
        <div className="space-y-8">

          {renderGroup(
            'Today',
            todayGroup,
          )}

          {renderGroup(
            'Later this week',
            weekGroup,
          )}

          {renderGroup(
            'Coming up',
            laterGroup,
          )}

          {!futureAppointments.length && (
            <div className="card text-center py-10">
              <CalendarDays
                className="w-12 h-12 mx-auto text-neutral-400"
                aria-hidden="true"
              />

              <p className="mt-3 font-bold text-neutral-800">
                No upcoming
                appointments
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">

          <section
            aria-label="Appointment calendar"
            className="card p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-4">

              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    changeMonth(
                      visibleMonth,
                      -1,
                    ),
                  )
                }
                aria-label="Previous month"
                className="w-11 h-11 rounded-lg border-2 border-neutral-300 flex items-center justify-center"
              >
                <ChevronLeft
                  className="w-5 h-5"
                  aria-hidden="true"
                />
              </button>

              <h2
                className="text-xl font-bold text-neutral-800 text-center"
                aria-live="polite"
              >
                {monthLabel(
                  visibleMonth,
                )}
              </h2>

              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    changeMonth(
                      visibleMonth,
                      1,
                    ),
                  )
                }
                aria-label="Next month"
                className="w-11 h-11 rounded-lg border-2 border-neutral-300 flex items-center justify-center"
              >
                <ChevronRight
                  className="w-5 h-5"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAYS.map(
                (day) => (
                  <div
                    key={day}
                    className="text-center text-xs sm:text-sm font-bold text-neutral-500 py-2"
                  >
                    {day}
                  </div>
                ),
              )}

              {days.map(
                (day) => {
                  const key =
                    dateKey(day);

                  const count =
                    appointmentsByDate.get(
                      key,
                    )?.length ?? 0;

                  const sameMonth =
                    day.getMonth() ===
                    visibleMonth.getMonth();

                  const selected =
                    key ===
                    selectedDate;

                  const isToday =
                    key === today;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelectedDate(
                          key,
                        )
                      }
                      aria-pressed={
                        selected
                      }
                      aria-label={`${formatDate(
                        key,
                      )}, ${count} appointment${count === 1 ? '' : 's'}`}
                      className={[
                        'relative min-h-[4rem] sm:min-h-[5rem] rounded-lg border-2 p-1.5 text-left',
                        sameMonth
                          ? 'bg-white'
                          : 'bg-neutral-50 text-neutral-400',
                        selected
                          ? 'border-calm-600 bg-calm-50'
                          : 'border-neutral-200',
                      ].join(' ')}
                    >
                      <span
                        className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday
                            ? 'bg-calm-600 text-white'
                            : ''
                        }`}
                      >
                        {day.getDate()}
                      </span>

                      {count > 0 && (
                        <span className="absolute bottom-1 left-1 right-1 text-center rounded-full bg-warm-100 text-warm-800 text-[0.65rem] font-bold py-0.5">
                          {count}{' '}
                          {count === 1
                            ? 'visit'
                            : 'visits'}
                        </span>
                      )}
                    </button>
                  );
                },
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-800">
              {formatDate(
                selectedDate,
              )}
            </h2>

            {selectedAppointments.length ? (
              selectedAppointments.map(
                (
                  appointment,
                ) => (
                  <AppointmentCard
                    key={
                      appointment.id
                    }
                    appointment={
                      appointment
                    }
                    today={today}
                    onAdd={
                      addToMyDay
                    }
                  />
                ),
              )
            ) : (
              <div className="card text-center py-8 text-neutral-500">
                No appointments on
                this date.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}