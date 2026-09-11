// src/screens/PatientTodayScreen.tsx
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
import { useAuth } from '../context/AuthContext';

type DoseStatus = 'due' | 'taken' | 'later';

interface Dose {
  id: string;
  medication: string;
  dose: string;
  time: string;
  status: DoseStatus;
}

const MOCK_DOSES: Dose[] = [
  {
    id: '1',
    medication: 'Memantine',
    dose: '10 mg — 1 tablet',
    time: 'Morning',
    status: 'due',
  },
  {
    id: '2',
    medication: 'Vitamin D3',
    dose: '1000 IU — 1 capsule',
    time: 'Morning',
    status: 'taken',
  },
  {
    id: '3',
    medication: 'Amlodipine',
    dose: '5 mg — 1 tablet',
    time: 'Afternoon',
    status: 'later',
  },
  {
    id: '4',
    medication: 'Atorvastatin',
    dose: '20 mg — 1 tablet',
    time: 'Bedtime',
    status: 'later',
  },
];

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export default function PatientTodayScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const dueNow = MOCK_DOSES.filter((d) => d.status === 'due');
  const laterToday = MOCK_DOSES.filter((d) => d.status === 'later');
  const alreadyDone = MOCK_DOSES.filter((d) => d.status === 'taken');

  const handleMarkTaken = (doseId: string) => {
    // TODO: wire to MedicationContext later
    console.log('Mark taken:', doseId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Greeting header */}
        <Text style={styles.date}>{TODAY}</Text>
        <Text style={styles.greeting}>
          Good morning, {user?.name || 'there'}
        </Text>

        {/* Progress summary */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Today's progress</Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressCount}>
              {alreadyDone.length} of {MOCK_DOSES.length}
            </Text>
            <Text style={styles.progressLabel}>doses taken</Text>
          </View>
        </View>

        {/* Due now */}
        <Text style={styles.sectionHeader}>Take these now</Text>
        {dueNow.length === 0 ? (
          <Text style={styles.emptyText}>Nothing due right now.</Text>
        ) : (
          dueNow.map((dose) => (
            <DoseCard
              key={dose.id}
              dose={dose}
              onMarkTaken={() => handleMarkTaken(dose.id)}
              onPress={() =>
                navigation.navigate('MedicationDetail', { medId: dose.id })
              }
            />
          ))
        )}

        {/* Later today */}
        <Text style={styles.sectionHeader}>Later today</Text>
        {laterToday.map((dose) => (
          <DoseCard
            key={dose.id}
            dose={dose}
            onPress={() =>
              navigation.navigate('MedicationDetail', { medId: dose.id })
            }
          />
        ))}

        {/* Already done */}
        <Text style={styles.sectionHeader}>Already done</Text>
        {alreadyDone.map((dose) => (
          <DoseCard
            key={dose.id}
            dose={dose}
            onPress={() =>
              navigation.navigate('MedicationDetail', { medId: dose.id })
            }
          />
        ))}

        {/* Today's appointment */}
        <Text style={styles.sectionHeader}>Today's appointment</Text>
        <TouchableOpacity
          style={styles.appointmentCard}
          accessibilityRole="button"
          accessibilityLabel="View today's appointment"
        >
          <Text style={styles.appointmentTitle}>Vision Plus Opticians</Text>
          <Text style={styles.appointmentDetail}>
            Today at 2:00 PM — 22 High Street
          </Text>
          <Text style={styles.appointmentDriver}>
            Maria Thompson is driving you
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

interface DoseCardProps {
  dose: Dose;
  onMarkTaken?: () => void;
  onPress?: () => void;
}

function DoseCard({ dose, onMarkTaken, onPress }: DoseCardProps) {
  const isTaken = dose.status === 'taken';
  const isDue = dose.status === 'due';

  return (
    <TouchableOpacity
      style={[
        styles.doseCard,
        isDue && styles.doseCardDue,
        isTaken && styles.doseCardTaken,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${dose.medication} ${dose.dose}, ${
        isTaken ? 'taken' : isDue ? 'due now' : 'later today'
      }`}
    >
      <View style={styles.doseHeader}>
        <Text style={styles.doseMedication}>{dose.medication}</Text>
        {isTaken && <Text style={styles.takenBadge}>✓ Taken</Text>}
      </View>
      <Text style={styles.doseDetails}>{dose.dose}</Text>
      <Text style={styles.doseTime}>{dose.time}</Text>

      {isDue && onMarkTaken && (
        <TouchableOpacity
          style={styles.markTakenButton}
          onPress={onMarkTaken}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${dose.medication} as taken`}
        >
          <Text style={styles.markTakenText}>Mark as taken</Text>
        </TouchableOpacity>
      )}

      {isTaken && (
        <Text style={styles.takenMessage}>
          You took this earlier today.
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 16, paddingBottom: 40 },
  date: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  progressCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A73E8',
  },
  progressLabel: {
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  doseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doseCardDue: {
    borderWidth: 2,
    borderColor: '#1A73E8',
  },
  doseCardTaken: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  doseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doseMedication: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  takenBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
  doseDetails: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 2,
  },
  doseTime: {
    fontSize: 13,
    color: '#94A3B8',
  },
  markTakenButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  markTakenText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  takenMessage: {
    fontSize: 13,
    color: '#16A34A',
    marginTop: 8,
    fontStyle: 'italic',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  appointmentDetail: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  appointmentDriver: {
    fontSize: 13,
    color: '#14B8A6',
    fontWeight: '500',
  },
});