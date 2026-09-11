// src/screens/MedicationDetailScreen.tsx
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

interface MedicationDetail {
  id: string;
  name: string;
  purpose: string;
  appearance: string;
  dose: string;
  schedule: string;
  prescriber: string;
  notes: string;
}

const MOCK_MEDICATIONS: Record<string, MedicationDetail> = {
  '1': {
    id: '1',
    name: 'Memantine',
    purpose: 'Helps with memory and thinking.',
    appearance: 'White oval tablet with "M 10" on one side.',
    dose: '10 mg — 1 tablet',
    schedule: 'Morning and bedtime',
    prescriber: 'Dr. Anita Sharma',
    notes: 'Take with or without food. Swallow whole with water.',
  },
  '2': {
    id: '2',
    name: 'Vitamin D3',
    purpose: 'Keeps bones strong.',
    appearance: 'Small yellow capsule.',
    dose: '1000 IU — 1 capsule',
    schedule: 'Morning with breakfast',
    prescriber: 'Dr. Anita Sharma',
    notes: 'Take with food for best absorption.',
  },
  '3': {
    id: '3',
    name: 'Amlodipine',
    purpose: 'Lowers blood pressure.',
    appearance: 'White round tablet.',
    dose: '5 mg — 1 tablet',
    schedule: 'Once daily in the afternoon',
    prescriber: 'Dr. Anita Sharma',
    notes: 'May cause mild ankle swelling. Report if severe.',
  },
  '4': {
    id: '4',
    name: 'Atorvastatin',
    purpose: 'Lowers cholesterol.',
    appearance: 'White oval tablet.',
    dose: '20 mg — 1 tablet',
    schedule: 'Once daily at bedtime',
    prescriber: 'Dr. Anita Sharma',
    notes: 'Avoid grapefruit juice while taking this medicine.',
  },
  '5': {
    id: '5',
    name: 'Paracetamol',
    purpose: 'For pain or fever.',
    appearance: 'White caplet.',
    dose: '500 mg — 1 to 2 tablets',
    schedule: 'Only if you need it',
    prescriber: 'Dr. Anita Sharma',
    notes: 'Do not exceed 8 tablets in 24 hours.',
  },
};

export default function MedicationDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { medId } = route.params || {};

  const medication = MOCK_MEDICATIONS[medId];

  if (!medication) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Medication not found.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back to medications list"
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
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.purpose}>{medication.purpose}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Dose</Text>
          <Text style={styles.sectionValue}>{medication.dose}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>When to take it</Text>
          <Text style={styles.sectionValue}>{medication.schedule}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What it looks like</Text>
          <Text style={styles.sectionValue}>{medication.appearance}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Prescribed by</Text>
          <Text style={styles.sectionValue}>{medication.prescriber}</Text>
        </View>

        <View style={[styles.section, styles.notesSection]}>
          <Text style={styles.sectionLabel}>Important notes</Text>
          <Text style={styles.sectionValue}>{medication.notes}</Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back to medications list"
        >
          <Text style={styles.backButtonText}>Back to medications</Text>
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
  name: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  purpose: {
    fontSize: 16,
    color: '#475569',
    fontStyle: 'italic',
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