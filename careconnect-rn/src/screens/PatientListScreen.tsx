import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { usePatients, Patient } from '../context/PatientContext';

export default function PatientListScreen() {
  const navigation = useNavigation<any>();
  const { patients } = usePatients();

  const handlePatientPress = (patient: Patient) => {
    navigation.navigate('AddEditPatient', { patient });
  };

  const handleAddPress = () => {
    navigation.navigate('AddPatient');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={styles.header}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="Patients Header"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
          accessible={true}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patients</Text>
      </View>

      {patients.length === 0 ? (
        <View
          style={styles.emptyContainer}
          accessible={true}
          accessibilityLabel="No patients yet. Add one!"
        >
          <Ionicons name="people-outline" size={56} color="#94A3B8" />
          <Text style={styles.emptyText}>No patients yet. Add one!</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handlePatientPress(item)}
              accessibilityRole="button"
              accessibilityLabel={`Patient ${item.name}, age ${item.age}, condition: ${item.condition}`}
              accessibilityHint="Double tap to view and edit patient details"
              accessible={true}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.patientName}>{item.name}</Text>
                <Text style={styles.patientDetails}>
                  {item.age} yrs • {item.condition}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddPress}
        accessibilityRole="button"
        accessibilityLabel="Add new patient"
        accessibilityHint="Opens form to add a new patient"
        accessible={true}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  patientDetails: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});
