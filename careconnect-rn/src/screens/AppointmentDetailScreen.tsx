// src/screens/AppointmentDetailScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

interface AppointmentDetail {
  id: string;
  title: string;
  when: string;
  location: string;
  driver?: string;
  duration: string;
  bring: string;
  notes: string;
}

const MOCK_APPOINTMENTS: Record<string, AppointmentDetail> = {
  '1': {
    id: '1',
    title: 'Vision Plus Opticians',
    when: 'Today at 2:00 PM',
    location: '22 High Street, Westfield',
    driver: 'Maria Thompson',
    duration: 'About 30 minutes',
    bring: 'Your current glasses, your glasses prescription card',
    notes: 'Routine yearly eye test. Your prescription may be updated.',
  },
  '2': {
    id: '2',
    title: 'Annual health review — Dr. Sharma',
    when: 'Monday 22 June at 2:00 PM',
    location: 'Greenfield Surgery — 12 Greenfield Road',
    driver: 'Maria Thompson',
    duration: 'About 45 minutes',
    bring: 'All your current medicines, a list of any symptoms',
    notes: 'Dr. Sharma will review all your medicines.',
  },
  '3': {
    id: '3',
    title: 'Dentist check-up',
    when: 'Friday 3 July at 10:00 AM',
    location: 'Westfield Dental — 8 Park Lane',
    duration: 'About 30 minutes',
    bring: 'Nothing needed',
    notes: 'Regular check-up and clean.',
  },
  '4': {
    id: '4',
    title: 'Blood test',
    when: 'Tuesday 5 May at 9:00 AM',
    location: 'Greenfield Surgery',
    duration: 'About 10 minutes',
    bring: 'Your appointment letter',
    notes: 'Routine blood test. Completed.',
  },
  '5': {
    id: '5',
    title: 'Eye screening',
    when: 'Wednesday 12 April at 3:00 PM',
    location: 'Westfield Hospital',
    duration: 'Cancelled',
    bring: 'N/A',
    notes: 'This appointment was cancelled. Please contact the hospital.',
  },
};

export default function AppointmentDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { apptId } = route.params || {};

  const appointment = MOCK_APPOINTMENTS[apptId];

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Appointment not found.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back to appointments list"
          >
            <Text style={styles.backButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{appointment.title}</Text>
        <Text style={styles.when}>{appointment.when}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Where to go</Text>
          <Text style={styles.sectionValue}>{appointment.location}</Text>
        </View>

        {appointment.driver && (
          <View style={[styles.section, styles.driverSection]}>
            <Text style={styles.sectionLabel}>Who is taking you</Text>
            <Text style={styles.sectionValue}>{appointment.driver}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>How long</Text>
          <Text style={styles.sectionValue}>{appointment.duration}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What to bring</Text>
          <Text style={styles.sectionValue}>{appointment.bring}</Text>
        </View>

        <View style={[styles.section, styles.notesSection]}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <Text style={styles.sectionValue}>{appointment.notes}</Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back to appointments list"
        >
          <Text style={styles.backButtonText}>Back to appointments</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFound: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  when: {
    fontSize: 17,
    color: '#1A73E8',
    fontWeight: '500',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverSection: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  notesSection: {
    backgroundColor: '#FEF9E7',
    borderColor: '#FDE68A',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    minHeight: 48,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});