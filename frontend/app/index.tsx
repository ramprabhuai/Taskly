import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING } from '../src/utils/constants';

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/auth');
      } else if (!user?.onboarding_complete) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/dashboard');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container} testID="splash-screen">
      <View style={styles.logoContainer}>
        <Text style={styles.logoIcon}>✨</Text>
        <Text style={styles.logoText}>TASKLY</Text>
        <Text style={styles.tagline}>Your tasks, your adventure</Text>
      </View>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.light.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.light.textSecondary,
    marginTop: SPACING.sm,
  },
  loader: {
    marginTop: SPACING.xxl,
  },
});
