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

export default function CaregiverActivityScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.badgeCaregiver}>
              <Ionicons name="person" size={14} color="#1A73E8" />
              <Text style={styles.badgeText}>Caregiver</Text>
            </View>

            <View style={{ flex: 1 }} />

            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>Joyce</Text>
            </View>
          </View>

          <View style={styles.greetingSection}>
            <Text style={styles.dateTimeText}>
              Thursday 4 June <Text style={styles.timeHighlight}>5:39 AM</Text>
            </Text>
            <Text style={styles.subGreetingText}>
              Good morning, Joyce · <Text style={styles.boldText}>Activity Log</Text>
            </Text>
            <Text style={styles.viewingText}>Viewing Margaret's care plan</Text>
          </View>
        </View>

        {/* Activity Log Section */}
        <View style={styles.activitySection}>
          <View style={styles.titleRow}>
            <Ionicons name="time" size={24} color="#1E293B" />
            <Text style={styles.sectionTitle}>Activity log</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Margaret's recent actions — medications taken, check-ins, and tasks
          </Text>

          {/* Filter Chips */}
          <View style={styles.chipsWrap}>
            <FilterChip label="Refresh" isActive={true} icon="refresh" />
            <FilterChip label="Medication taken" isActive={false} />
            <FilterChip label="Medication unmarked" isActive={false} />
            <FilterChip label="Task completed" isActive={false} />
            <FilterChip label="Checked in" isActive={false} />
          </View>

          {/* Empty State */}
          <View style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={48} color="#C9D1DC" />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyDescription}>
              Events will appear here when Margaret takes medications, completes tasks, or checks in.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ label, isActive, icon }: { label: string; isActive: boolean; icon?: string }) {
  return (
    <View style={styles.chip}>
      {isActive && <View style={styles.activeDot} />}
      {icon && <Ionicons name={icon as any} size={14} color="#1A73E8" style={{ marginRight: 6 }} />}
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F7F9' },
  content: { padding: 16, paddingBottom: 40 },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
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
    backgroundColor: '#D7EAF4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#17724533',
    marginLeft: 12,
  },
  badgeText: { color: '#1A73E8', fontSize: 14, marginLeft: 4, fontWeight: '500' },
  userBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  userBadgeText: { fontWeight: '600', color: '#1E293B' },
  greetingSection: { marginTop: 4 },
  dateTimeText: { fontSize: 26, fontWeight: 'bold', color: '#1F2937' },
  timeHighlight: { color: '#1A73E8' },
  subGreetingText: { fontSize: 16, color: '#667085', marginTop: 8 },
  boldText: { color: '#1F2937', fontWeight: '600' },
  viewingText: { color: '#1A73E8', fontSize: 14, marginTop: 4 },
  activitySection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginLeft: 8 },
  sectionSubtitle: { color: '#667085', fontSize: 15, marginBottom: 16 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D5DBE3',
  },
  activeDot: { width: 10, height: 10, backgroundColor: '#1A73E8', borderRadius: 5, marginRight: 8 },
  chipText: { color: '#1F2937', fontWeight: '500' },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#C9D1DC',
    backgroundColor: '#FAFAFA',
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 12, marginBottom: 8 },
  emptyDescription: { textAlign: 'center', color: '#667085', fontSize: 15 },
});
