// src/screens/RoleSelectionScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth, Role } from '../context/AuthContext';

export default function RoleSelectionScreen() {
  const navigation = useNavigation<any>();
  const { user, setRole } = useAuth();

  const chooseRole = (selectedRole: Role) => {
    setRole(selectedRole);
    navigation.navigate('HomeTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>
          Welcome{user?.name ? `, ${user.name}` : ''}!
        </Text>
        <Text style={styles.subheading}>
          How are you using CareConnect today?
        </Text>

        <TouchableOpacity
          style={[styles.roleCard, { borderColor: '#1A73E8' }]}
          onPress={() => chooseRole('patient')}
          accessibilityRole="button"
          accessibilityLabel="Select patient role, manage your own care"
        >
          <Text style={styles.roleIcon}>👤</Text>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleTitle}>I'm a Patient</Text>
            <Text style={styles.roleSubtitle}>Manage your own care</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, { borderColor: '#14B8A6' }]}
          onPress={() => chooseRole('caregiver')}
          accessibilityRole="button"
          accessibilityLabel="Select caregiver role, manage patients you care for"
        >
          <Text style={styles.roleIcon}>👥</Text>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleTitle}>I'm a Caregiver</Text>
            <Text style={styles.roleSubtitle}>
              Manage patients you care for
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  subheading: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    minHeight: 88,
  },
  roleIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  roleTextContainer: { flex: 1 },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  roleSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
});