// src/screens/SignUpScreen.tsx
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
import { useNavigation } from '@react-navigation/native';

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    // Mock signup — any values work
    navigation.navigate('RoleSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.subheading}>
          Free, private, and takes under two minutes.
        </Text>

        <Text style={styles.label}>Your name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dorothy Smith"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
          accessibilityLabel="Your name"
        />

        <Text style={styles.label}>Email address *</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          accessibilityLabel="Email address"
        />

        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          accessibilityLabel="Password"
        />
        <Text style={styles.hint}>At least 6 characters.</Text>

        <Text style={styles.label}>Confirm password *</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#94A3B8"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          accessibilityLabel="Confirm password"
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignUp}
          accessibilityRole="button"
          accessibilityLabel="Create your new account"
        >
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignIn')}
          accessibilityRole="button"
          accessibilityLabel="Already have an account, tap to sign in"
        >
          <Text style={styles.link}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    alignSelf: 'flex-start',
    marginTop: 14,
    marginBottom: 6,
    width: '100%',
    maxWidth: 400,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    alignSelf: 'flex-start',
    marginTop: 4,
    width: '100%',
    maxWidth: 400,
  },
  primaryButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 16,
    borderRadius: 28,
    marginTop: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    color: '#1A73E8',
    fontWeight: '500',
    marginTop: 20,
  },
});