// src/screens/LandingScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LandingScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App title */}
        <Text style={styles.title}>CareConnect</Text>

        {/* Primary action: Sign In */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SignIn')}
          accessibilityRole="button"
          accessibilityLabel="Sign in to your existing account"
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Secondary action: Sign Up */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SignUp')}
          accessibilityRole="button"
          accessibilityLabel="Create a new account"
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Hero circle + heart */}
        <View style={styles.circle}>
          <Text style={styles.heart}>💙</Text>
        </View>

        {/* Taglines */}
        <Text style={styles.tagline}>Your daily companion</Text>
        <Text style={styles.tagline}>for calm, confident care.</Text>

        {/* Description */}
        <Text style={styles.description}>
          For people who need a little help remembering,
        </Text>
        <Text style={styles.description}>
          and the people who care for them.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1A73E8',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#1A73E8',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginBottom: 48,
  },
  secondaryButtonText: {
    color: '#1A73E8',
    fontSize: 18,
    fontWeight: '600',
  },
  circle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  heart: {
    fontSize: 56,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});