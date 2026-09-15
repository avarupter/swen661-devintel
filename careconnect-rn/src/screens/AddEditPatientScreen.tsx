import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { usePatients } from '../context/PatientContext';

export default function AddEditPatientScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const patient = route.params?.patient;
  const isEditing = !!patient;

  const { addPatient, updatePatient } = usePatients();

  const [name, setName] = useState(patient?.name || '');
  const [age, setAge] = useState(patient?.age ? patient.age.toString() : '');
  const [condition, setCondition] = useState(patient?.condition || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('Please enter a patient name');
      return;
    }
    if (!age.trim() || isNaN(Number(age))) {
      setError('Please enter a valid age');
      return;
    }
    setError('');

    const parsedAge = parseInt(age.trim(), 10);
    const trimmedName = name.trim();
    const trimmedCondition = condition.trim();

    if (isEditing) {
      updatePatient({
        id: patient.id,
        name: trimmedName,
        age: parsedAge,
        condition: trimmedCondition,
      });
    } else {
      addPatient({
        name: trimmedName,
        age: parsedAge,
        condition: trimmedCondition,
      });
    }

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Patient' : 'Add Patient'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.formCard}>
          <Text style={styles.label}>Patient Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Margaret Smith"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            accessibilityLabel="Patient name required"
          />

          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 78"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={age}
            onChangeText={setAge}
            accessibilityLabel="Patient age required"
          />

          <Text style={styles.label}>Condition</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Routine care & Vision"
            placeholderTextColor="#9CA3AF"
            value={condition}
            onChangeText={setCondition}
            accessibilityLabel="Medical condition"
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel={isEditing ? 'Save patient changes' : 'Add new patient'}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? 'Update Patient' : 'Add Patient'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    padding: 16,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 16,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
