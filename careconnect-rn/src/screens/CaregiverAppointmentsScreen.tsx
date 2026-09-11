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

export default function CaregiverAppointmentsScreen() {
  const navigation = useNavigation<any>();

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
            <Ionicons name="person" size={14} color="#1F6F56" />
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
            Thursday 4 June <Text style={styles.timeHighlight}>5:39 AM</Text>
          </Text>
          <Text style={styles.subGreetingText}>
            Good morning, Joyce · <Text style={styles.boldText}>Manage Appointments</Text>
          </Text>
          <Text style={styles.viewingText}>Viewing Margaret's care plan</Text>
        </View>

        {/* Appointments List */}
        <View style={styles.listContainer}>
          <AppointmentCard
            title="Vision Plus Opticians"
            subtitle="22 High Street, Westfield"
            note="Routine yearly eye test. Your glasses prescription may be updated. No special preparation needed."
            onEdit={() => {}}
            onDelete={() => {}}
          />
          <AppointmentCard
            title="Annual health review — Dr. Sharma"
            subtitle="Monday 22 June — 2:00 pm"
            location="Greenfield Surgery — 12 Greenfield Road, Westfield"
            note="Your yearly health check. Dr. Sharma will review all your medicines. Maria will drive you."
            isLarge={true}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface AppointmentCardProps {
  title: string;
  subtitle: string;
  location?: string;
  note: string;
  isLarge?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function AppointmentCard({
  title,
  subtitle,
  location,
  note,
  isLarge = false,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Ionicons name="location-outline" size={16} color="#6D7788" />
        <Text
          style={[
            styles.cardTitle,
            isLarge && styles.cardTitleLarge,
          ]}
        >
          {title}
        </Text>
      </View>

      {location && (
        <View style={[styles.cardRow, styles.spacingTop]}>
          <Ionicons name="location-outline" size={16} color="#6D7788" />
          <Text style={styles.cardSubtitle}>{location}</Text>
        </View>
      )}

      <View style={[styles.cardRow, styles.spacingTop]}>
        <Ionicons name="time-outline" size={16} color="#6D7788" />
        <Text style={styles.cardTime}>{subtitle}</Text>
      </View>

      <View style={styles.noteBox}>
        <Ionicons name="information-circle-outline" size={16} color="#6D7788" style={{ marginTop: 2 }} />
        <Text style={styles.noteText}>{note}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.outlinedButton}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel="Edit this appointment"
        >
          <Ionicons name="create-outline" size={16} color="#1E7099" />
          <Text style={styles.outlinedButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete this appointment"
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#CDEADF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginLeft: 12,
  },
  badgeText: { color: '#1F6F56', fontSize: 14, marginLeft: 4, fontWeight: '500' },
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
  dateTimeText: { fontSize: 26, fontWeight: 'bold', color: '#27303F' },
  timeHighlight: { color: '#1A73E8' },
  subGreetingText: { fontSize: 16, color: '#6D7788', marginTop: 8 },
  boldText: { color: '#27303F', fontWeight: '600' },
  viewingText: { color: '#1F6F56', fontSize: 14, marginTop: 4 },
  listContainer: { gap: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#27303F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  spacingTop: { marginTop: 8 },
  cardTitle: { fontSize: 16, color: '#27303F', marginLeft: 8, flex: 1 },
  cardTitleLarge: { fontSize: 20, fontWeight: '600' },
  cardSubtitle: { fontSize: 14, color: '#6D7788', marginLeft: 8, flex: 1 },
  cardTime: { fontSize: 14, color: '#27303F', marginLeft: 8, flex: 1 },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#F3F5F7',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D6DCE3',
    marginTop: 12,
  },
  noteText: { fontSize: 14, color: '#27303F', marginLeft: 8, flex: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  outlinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E7099',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  outlinedButtonText: { color: '#1E7099', fontWeight: '600', marginLeft: 6 },
  deleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  deleteButtonText: { color: '#FFFFFF', fontWeight: '600' },
});
