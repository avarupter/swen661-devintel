import 'package:careconnect_mobile/core/clock.dart';
import 'package:careconnect_mobile/data/seed_data.dart';
import 'package:careconnect_mobile/models/appointment.dart';
import 'package:careconnect_mobile/providers/appointment_provider.dart';
import 'package:careconnect_mobile/services/care_repository.dart';
import 'package:careconnect_mobile/services/json_store.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  late FixedClock clock;
  late InMemoryJsonStore store;
  late AppointmentProvider provider;

  setUp(() async {
    clock = FixedClock.at(2026, 9, 8, 7, 45);
    store = InMemoryJsonStore();
    provider = AppointmentProvider(
      repository: JsonCareRepository(
        store: store,
        seed: CareSeed(clock: clock),
      ),
      clock: clock,
    );
    await provider.load();
  });

  test('seed puts one appointment on today and sorts the rest', () {
    expect(provider.todaysAppointments.single.id, 'apt-memory-clinic');
    expect(provider.upcoming.first.id, 'apt-memory-clinic');
    expect(provider.past.single.id, 'apt-podiatry-past');
  });

  test('next appointment sentence names the day, time and who is taking her', () {
    expect(
      provider.nextAppointmentSentence,
      allOf(
        contains('Memory Clinic follow-up'),
        contains('today'),
        contains('10:30 AM'),
        contains('Joyce'),
      ),
    );
  });

  test('relative day labels avoid raw dates', () {
    final next = provider.nextAppointment!;
    expect(next.relativeDayLabel(provider.now), 'Today');
    expect(
      provider.appointmentById('apt-blood-pressure')!
          .relativeDayLabel(provider.now),
      startsWith('In 2 days'),
    );
    expect(
      provider.appointmentById('apt-podiatry-past')!
          .relativeDayLabel(provider.now),
      '6 days ago',
    );
  });

  test('an appointment moves from upcoming to past as the clock advances', () {
    expect(provider.upcoming.map((a) => a.id), contains('apt-memory-clinic'));
    clock.advance(const Duration(hours: 6)); // 13:45, after 10:30 + 45 min
    provider.syncNow();
    expect(provider.upcoming.map((a) => a.id), isNot(contains('apt-memory-clinic')));
    expect(provider.past.first.id, 'apt-memory-clinic');
  });

  test('in progress is detected inside the appointment window', () {
    expect(provider.inProgress, isNull);
    clock.setTo(DateTime(2026, 9, 8, 10, 45));
    provider.syncNow();
    expect(provider.inProgress!.id, 'apt-memory-clinic');
  });

  test('cancelling keeps the row visible but out of upcoming', () async {
    await provider.cancelAppointment('apt-hearing');
    expect(provider.appointmentById('apt-hearing')!.isCancelled, isTrue);
    expect(provider.upcoming.map((a) => a.id), isNot(contains('apt-hearing')));
    expect(provider.cancelled.single.id, 'apt-hearing');
  });

  test('grouping upcoming by day gives one bucket per date', () {
    expect(provider.upcomingByDay.keys.length, 4);
  });

  test('appointment round-trips through JSON including transport and prep', () {
    final original = provider.appointmentById('apt-memory-clinic')!;
    expect(Appointment.fromJson(original.toJson()), original);
  });

  test('appointments persist across a reload', () async {
    await provider.cancelAppointment('apt-hearing');
    final reloaded = AppointmentProvider(
      repository: JsonCareRepository(store: store, seed: CareSeed(clock: clock)),
      clock: clock,
    );
    await reloaded.load();
    expect(reloaded.appointmentById('apt-hearing')!.isCancelled, isTrue);
  });
}
