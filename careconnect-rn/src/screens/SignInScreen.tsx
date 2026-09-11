// src/screens/SignInScreen.tsx
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
import { useAuth } from '../context/AuthContext';

export default function SignInScreen() {
  const navigation = useNavigation<any>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    signIn(email || 'mary@example.com', password || 'password123');
    navigation.navigate('RoleSelection');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Sign In</Text>

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

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSignIn}
          accessibilityRole="button"
          accessibilityLabel="Sign in to your account"
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignUp')}
          accessibilityRole="button"
          accessibilityLabel="New user, tap to sign up"
        >
          <Text style={styles.link}>New? Click here to sign up.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginTop: 12,
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