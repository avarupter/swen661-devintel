import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';

export default function CaregiverMedicationFormsScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [schedule, setSchedule] = useState('');

  const handleSave = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.badgeCaregiver}>
            <Ionicons name="person" size={14} color="#16694C" />
            <Text style={styles.badgeText}>Caregiver</Text>
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>Joyce</Text>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingCard}>
          <Text style={styles.dateTimeText}>
            Thursday 4 June <Text style={styles.timeHighlight}>5:38 AM</Text>
          </Text>
          <Text style={styles.subGreetingText}>
            Good morning, Joyce · <Text style={styles.boldText}>Manage Medications</Text>
          </Text>
          <Text style={styles.viewingText}>Viewing Margaret's care plan</Text>
        </View>

        {/* Navigation Sidebar/Buttons */}
        <View style={styles.navButtonsContainer}>
          <NavButton label="Dashboard" icon="grid-outline" isActive={false} />
          <NavButton label="Medications" icon="medical-outline" isActive={true} />
          <NavButton label="Appointments" icon="calendar-outline" isActive={false} />
          <NavButton label="Activity" icon="fitness-outline" isActive={false} />
          <NavButton label="Notes" icon="document-text-outline" isActive={false} />
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add new medication</Text>

          <Text style={styles.labelRequired}>Medication name (required) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Amlodipine"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.labelRequired}>Dose (required) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 5 mg — 1 tablet"
            placeholderTextColor="#9CA3AF"
            value={dose}
            onChangeText={setDose}
          />
          <Text style={styles.helperText}>Include strength, form, and quantity.</Text>

          <Text style={styles.labelRequired}>Schedule times (required) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 8:30 AM, 2:00 PM"
            placeholderTextColor="#9CA3AF"
            value={schedule}
            onChangeText={setSchedule}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save Medication"
          >
            <Text style={styles.saveButtonText}>Save Medication</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NavButton({ label, icon, isActive }: { label: string; icon: string; isActive: boolean }) {
  return (
    <View style={[styles.navButton, isActive && styles.navButtonActive]}>
      <Ionicons
        name={icon as any}
        size={20}
        color={isActive ? '#0A7199' : '#1F2937'}
      />
      <Text style={[styles.navButtonText, isActive && styles.navButtonTextActive]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCaregiver: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEF2EA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 12,
  },
  badgeText: { color: '#16694C', fontSize: 13, marginLeft: 4, fontWeight: '500' },
  userBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  userBadgeText: { fontWeight: '600', color: '#1E293B' },
  greetingCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  dateTimeText: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  timeHighlight: { color: '#1A73E8' },
  subGreetingText: { fontSize: 16, color: '#667085', marginTop: 8 },
  boldText: { color: '#1F2937', fontWeight: '600' },
  viewingText: { color: '#16694C', fontSize: 13, marginTop: 4 },
  navButtonsContainer: { marginBottom: 24, gap: 8 },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  navButtonActive: {
    backgroundColor: '#D9EEF7',
  },
  navButtonText: { fontSize: 16, color: '#1F2937', marginLeft: 12 },
  navButtonTextActive: { color: '#0A7199', fontWeight: '600' },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#C7D0DA',
  },
  formTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  labelRequired: { color: '#DC2626', fontWeight: '600', marginBottom: 8, fontSize: 14 },
  input: {
    borderWidth: 2,
    borderColor: '#BCC5D1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  helperText: { color: '#667085', fontSize: 13, marginBottom: 16, marginTop: -8 },
  saveButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
