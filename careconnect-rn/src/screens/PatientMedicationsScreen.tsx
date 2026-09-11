// src/screens/PatientMedicationsScreen.tsx
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

interface Medication {
  id: string;
  name: string;
  purpose: string;
  appearance: string;
  dose: string;
  schedule: string;
  dosesToday: string;
  isAsNeeded?: boolean;
}

const MOCK_MEDICATIONS: Medication[] = [
  {
    id: '1',
    name: 'Memantine',
    purpose: 'Helps with memory and thinking',
    appearance: 'White oval tablet',
    dose: '10 mg — 1 tablet',
    schedule: 'Morning and bedtime',
    dosesToday: '1 of 2 taken today',
  },
  {
    id: '2',
    name: 'Vitamin D3',
    purpose: 'Keeps bones strong',
    appearance: 'Small yellow capsule',
    dose: '1000 IU — 1 capsule',
    schedule: 'Morning with breakfast',
    dosesToday: 'Taken today',
  },
  {
    id: '3',
    name: 'Amlodipine',
    purpose: 'Lowers blood pressure',
    appearance: 'White round tablet',
    dose: '5 mg — 1 tablet',
    schedule: 'Once daily in the afternoon',
    dosesToday: 'Not yet taken',
  },
  {
    id: '4',
    name: 'Atorvastatin',
    purpose: 'Lowers cholesterol',
    appearance: 'White oval tablet',
    dose: '20 mg — 1 tablet',
    schedule: 'Once daily at bedtime',
    dosesToday: 'Not yet taken',
  },
  {
    id: '5',
    name: 'Paracetamol',
    purpose: 'For pain or fever',
    appearance: 'White caplet',
    dose: '500 mg — 1–2 tablets',
    schedule: 'Only if you need it',
    dosesToday: 'Not needed today',
    isAsNeeded: true,
  },
];

export default function PatientMedicationsScreen() {
  const navigation = useNavigation<any>();

  const regular = MOCK_MEDICATIONS.filter((m) => !m.isAsNeeded);
  const asNeeded = MOCK_MEDICATIONS.filter((m) => m.isAsNeeded);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>My Medications</Text>
        <Text style={styles.subheading}>
          Every medicine you take, and what it is for.
        </Text>

        <Text style={styles.sectionHeader}>Regular medicines</Text>
        {regular.map((med) => (
          <MedicationCard
            key={med.id}
            medication={med}
            onPress={() =>
              navigation.navigate('MedicationDetail', { medId: med.id })
            }
          />
        ))}

        <Text style={styles.sectionHeader}>Only if you need it</Text>
        {asNeeded.map((med) => (
          <MedicationCard
            key={med.id}
            medication={med}
            onPress={() =>
              navigation.navigate('MedicationDetail', { medId: med.id })
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

interface MedicationCardProps {
  medication: Medication;
  onPress?: () => void;
}

function MedicationCard({ medication, onPress }: MedicationCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${medication.name}. ${medication.purpose}. ${medication.dosesToday}`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.medName}>{medication.name}</Text>
        <Text style={styles.doseStatus}>{medication.dosesToday}</Text>
      </View>

      <Text style={styles.purpose}>{medication.purpose}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Dose:</Text>
        <Text style={styles.metaValue}>{medication.dose}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>When:</Text>
        <Text style={styles.metaValue}>{medication.schedule}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Looks like:</Text>
        <Text style={styles.metaValue}>{medication.appearance}</Text>
      </View>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  medName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  doseStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A73E8',
  },
  purpose: {
    fontSize: 15,
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    width: 90,
  },
  metaValue: {
    fontSize: 13,
    color: '#1E293B',
    flex: 1,
  },
});