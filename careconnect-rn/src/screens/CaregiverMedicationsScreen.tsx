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
import { Ionicons } from '@react-native-vector-icons/ionicons';

export default function CaregiverMedicationsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.badgeCaregiver}>
            <Ionicons name="person" size={14} color="#146C94" />
            <Text style={styles.badgeText}>Caregiver</Text>
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.userBadge}>
            <Text style={styles.userBadgeText}>Joyce</Text>
          </View>
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingCard}>
          <Text style={styles.dateTimeText}>
            Thursday 4 June <Text style={styles.timeHighlight}>5:38 AM</Text>
          </Text>
          <Text style={styles.subGreetingText}>
            Good morning, Joyce · <Text style={styles.boldText}>Manage Medications</Text>
          </Text>
          <Text style={styles.viewingText}>Viewing Margaret's care plan</Text>
        </View>

        {/* Medication List */}
        <View style={styles.listContainer}>
          <MedicationCard
            title="8:30 am"
            note="Take with or without food."
            time="8:30 am"
            onEdit={() => {}}
            onDelete={() => {}}
          />
          <MedicationCard
            title="Vitamin D3"
            dosage="1000 IU — 1 capsule"
            note="Take with breakfast."
            time="8:30 am"
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface MedicationCardProps {
  title: string;
  dosage?: string;
  note: string;
  time: string;
  onEdit: () => void;
  onDelete: () => void;
}

function MedicationCard({ title, dosage, note, time, onEdit, onDelete }: MedicationCardProps) {
  return (
    <View style={styles.card}>
      {dosage ? (
        <>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDosage}>{dosage}</Text>
        </>
      ) : (
        <Text style={styles.cardTitle}>{title}</Text>
      )}

      <View style={styles.timeBadge}>
        <Ionicons name="time-outline" size={14} color="#146C94" />
        <Text style={styles.timeBadgeText}>{time}</Text>
      </View>

      <Text style={styles.cardNote}>{note}</Text>

      <View style={styles.divider} />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.outlinedButton}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="Edit this medication"
        >
          <Ionicons name="create-outline" size={16} color="#146C94" />
          <Text style={styles.outlinedButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete this medication"
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  content: { padding: 16, paddingBottom: 40 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#CDE9DE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 12,
  },
  badgeText: { color: '#146C94', fontSize: 14, marginLeft: 4, fontWeight: '500' },
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
    marginBottom: 16,
  },
  dateTimeText: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  timeHighlight: { color: '#1A73E8' },
  subGreetingText: { fontSize: 16, color: '#667085', marginTop: 8 },
  boldText: { color: '#1F2937', fontWeight: '600' },
  viewingText: { color: '#146C94', fontSize: 14, marginTop: 4 },
  listContainer: { gap: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFC7D1',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  cardDosage: { fontSize: 16, color: '#4B5563', marginBottom: 8 },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D5EDF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  timeBadgeText: { color: '#146C94', fontSize: 14, marginLeft: 4, fontWeight: '500' },
  cardNote: { color: '#667085', fontStyle: 'italic', marginBottom: 16 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  outlinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#146C94',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  outlinedButtonText: { color: '#146C94', fontWeight: '600', marginLeft: 6 },
  deleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  deleteButtonText: { color: '#FFFFFF', fontWeight: '600' },
});
