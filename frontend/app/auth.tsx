import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../src/utils/constants';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, guestLogin } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Please enter your name'); setLoading(false); return; }
        await register(email, password, name);
      }
      router.replace('/onboarding');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      await guestLogin();
      router.replace('/onboarding');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logoIcon}>✨</Text>
            <Text style={styles.logo}>TASKLY</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? 'Welcome back, hero!' : 'Start your adventure!'}
            </Text>
          </View>

          <View style={styles.card} testID="auth-card">
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  testID="auth-name-input"
                  style={styles.input}
                  placeholder="What should we call you?"
                  placeholderTextColor={COLORS.light.textTertiary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                testID="auth-email-input"
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.light.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                testID="auth-password-input"
                style={styles.input}
                placeholder="Your secret password"
                placeholderTextColor={COLORS.light.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.error} testID="auth-error">{error}</Text> : null}

            <TouchableOpacity
              testID="auth-submit-btn"
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="auth-toggle-btn"
              onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              style={styles.toggleBtn}
            >
              <Text style={styles.toggleText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleBold}>
                  {mode === 'login' ? 'Sign Up' : 'Sign In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            testID="guest-login-btn"
            style={styles.guestBtn}
            onPress={handleGuest}
            activeOpacity={0.8}
          >
            <Text style={styles.guestIcon}>🚀</Text>
            <Text style={styles.guestBtnText}>Continue as Guest</Text>
          </TouchableOpacity>

          <Text style={styles.guestHint}>No account needed — try everything instantly!</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.light.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, padding: SPACING.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoIcon: { fontSize: 48, marginBottom: SPACING.sm },
  logo: { fontSize: 36, fontWeight: '900', color: COLORS.primary, letterSpacing: 3 },
  subtitle: { fontSize: 16, color: COLORS.light.textSecondary, marginTop: SPACING.xs },
  card: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.light.text, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.light.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.light.text,
    borderWidth: 1.5,
    borderColor: COLORS.light.border,
  },
  error: { color: COLORS.error, fontSize: 14, marginBottom: SPACING.md, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.sm,
    ...SHADOWS.sm,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  toggleBtn: { marginTop: SPACING.md, alignItems: 'center' },
  toggleText: { color: COLORS.light.textSecondary, fontSize: 14 },
  toggleBold: { color: COLORS.primary, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.light.border },
  dividerText: { marginHorizontal: SPACING.md, color: COLORS.light.textTertiary, fontSize: 13, fontWeight: '600' },
  guestBtn: {
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  guestIcon: { fontSize: 20, marginRight: SPACING.sm },
  guestBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  guestHint: { textAlign: 'center', color: COLORS.light.textTertiary, fontSize: 13, marginTop: SPACING.sm },
});
