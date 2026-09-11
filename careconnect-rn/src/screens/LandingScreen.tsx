// src/screens/LandingScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function LandingScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CareConnect</Text>
        <View style={styles.links}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignIn' as never)}
            accessibilityRole="button"
            accessibilityLabel="Sign in to your account"
          >
            <Text style={styles.link}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp' as never)}
            accessibilityRole="button"
            accessibilityLabel="Create a new account"
          >
            <Text style={styles.link}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.circle}>
          <Text style={styles.heart}>💙</Text>
        </View>
        <Text style={styles.tagline}>Your daily companion</Text>
        <Text style={styles.tagline}>for calm, confident care.</Text>
        <Text style={styles.description}>
          For people who need a little help remembering,
        </Text>
        <Text style={styles.description}>
          and the people who care for them.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SignUp' as never)}
          accessibilityRole="button"
          accessibilityLabel="Get started for free"
        >
          <Text style={styles.primaryButtonText}>Get started — it's free →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignIn' as never)}
          accessibilityRole="button"
          accessibilityLabel="I already have an account"
        >
          <Text style={styles.link}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  links: {
    flexDirection: 'row',
    gap: 16,
  },
  link: {
    fontSize: 14,
    color: '#1A73E8',
    fontWeight: '500',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  heart: {
    fontSize: 64,
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
  primaryButton: {
    backgroundColor: '#1A73E8',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});