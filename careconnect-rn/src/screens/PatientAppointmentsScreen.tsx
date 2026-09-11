// src/screens/PatientAppointmentsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

type AppointmentStatus = 'today' | 'upcoming' | 'past' | 'cancelled';

interface Appointment {
  id: string;
  title: string;
  location: string;
  when: string;
  driver?: string;
  status: AppointmentStatus;
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    title: 'Vision Plus Opticians',
    location: '22 High Street, Westfield',
    when: 'Today at 2:00 PM',
    driver: 'Maria Thompson',
    status: 'today',
  },
  {
    id: '2',
    title: 'Annual health review — Dr. Sharma',
    location: 'Greenfield Surgery — 12 Greenfield Road',
    when: 'Monday 22 June at 2:00 PM',
    driver: 'Maria Thompson',
    status: 'upcoming',
  },
  {
    id: '3',
    title: 'Dentist check-up',
    location: 'Westfield Dental — 8 Park Lane',
    when: 'Friday 3 July at 10:00 AM',
    status: 'upcoming',
  },
  {
    id: '4',
    title: 'Blood test',
    location: 'Greenfield Surgery',
    when: 'Tuesday 5 May at 9:00 AM',
    status: 'past',
  },
  {
    id: '5',
    title: 'Eye screening',
    location: 'Westfield Hospital',
    when: 'Wednesday 12 April at 3:00 PM',
    status: 'cancelled',
  },
];

export default function PatientAppointmentsScreen() {
  const navigation = useNavigation<any>();

  const today = MOCK_APPOINTMENTS.filter((a) => a.status === 'today');
  const upcoming = MOCK_APPOINTMENTS.filter((a) => a.status === 'upcoming');
  const past = MOCK_APPOINTMENTS.filter((a) => a.status === 'past');
  const cancelled = MOCK_APPOINTMENTS.filter((a) => a.status === 'cancelled');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>My Appointments</Text>
        <Text style={styles.subheading}>
          Everything coming up, and what has already happened.
        </Text>

        {today.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Today</Text>
            {today.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onPress={() =>
                  navigation.navigate('AppointmentDetail', { apptId: appt.id })
                }
              />
            ))}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Coming up</Text>
            {upcoming.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onPress={() =>
                  navigation.navigate('AppointmentDetail', { apptId: appt.id })
                }
              />
            ))}
          </>
        )}

        {cancelled.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Cancelled</Text>
            {cancelled.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onPress={() =>
                  navigation.navigate('AppointmentDetail', { apptId: appt.id })
                }
              />
            ))}
          </>
        )}

        {past.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Already happened</Text>
            {past.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onPress={() =>
                  navigation.navigate('AppointmentDetail', { apptId: appt.id })
                }
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
}

function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const isCancelled = appointment.status === 'cancelled';
  const isToday = appointment.status === 'today';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isToday && styles.cardToday,
        isCancelled && styles.cardCancelled,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${appointment.title}, ${appointment.when}${
        appointment.driver ? `, ${appointment.driver} is driving` : ''
      }`}
    >
      <Text
        style={[
          styles.apptTitle,
          isCancelled && styles.cancelledText,
        ]}
      >
        {appointment.title}
      </Text>

      <Text style={styles.apptWhen}>{appointment.when}</Text>
      <Text style={styles.apptLocation}>{appointment.location}</Text>

      {appointment.driver && !isCancelled && (
        <View style={styles.driverBadge}>
          <Text style={styles.driverText}>
            {appointment.driver} is driving you
          </Text>
        </View>
      )}

      {isCancelled && (
        <Text style={styles.cancelledNote}>
          This appointment was cancelled. Tap for details.
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 16, paddingBottom: 40 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardToday: {
    borderWidth: 2,
    borderColor: '#1A73E8',
  },
  cardCancelled: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  apptTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  cancelledText: {
    color: '#991B1B',
    textDecorationLine: 'line-through',
  },
  apptWhen: {
    fontSize: 15,
    color: '#1A73E8',
    fontWeight: '500',
    marginBottom: 4,
  },
  apptLocation: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  driverBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  driverText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
  },
  cancelledNote: {
    fontSize: 13,
    color: '#991B1B',
    fontStyle: 'italic',
    marginTop: 4,
  },
});