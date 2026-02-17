import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { api } from '../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, MASCOTS } from '../src/utils/constants';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = [
  'welcome',
  'name',
  'purpose',
  'mascot',
  'notifications',
  'first_task',
  'celebration',
];

const PURPOSES = [
  { id: 'school', emoji: '📚', label: 'School' },
  { id: 'work', emoji: '💼', label: 'Work' },
  { id: 'personal', emoji: '🏠', label: 'Personal' },
  { id: 'everything', emoji: '🌟', label: 'Everything' },
];

const NOTIF_STYLES = [
  { id: 'chill', emoji: '😌', label: 'Chill', desc: '1-2 reminders per day' },
  { id: 'normal', emoji: '👍', label: 'Normal', desc: '3-4 reminders per day' },
  { id: 'intense', emoji: '🔥', label: 'Intense', desc: 'Never miss a beat!' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [mascot, setMascot] = useState('');
  const [notifStyle, setNotifStyle] = useState('');
  const [firstTask, setFirstTask] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const currentStep = STEPS[step];

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'name': return name.trim().length > 0;
      case 'purpose': return purpose.length > 0;
      case 'mascot': return mascot.length > 0;
      case 'notifications': return notifStyle.length > 0;
      case 'first_task': return firstTask.trim().length > 0;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === 'name') {
      await api.updateOnboarding({ name });
    } else if (currentStep === 'purpose') {
      await api.updateOnboarding({ purpose });
    } else if (currentStep === 'mascot') {
      await api.updateOnboarding({ mascot });
    } else if (currentStep === 'notifications') {
      await api.updateOnboarding({ notification_style: notifStyle });
    } else if (currentStep === 'first_task') {
      setLoading(true);
      try {
        await api.createTask({ title: firstTask, emoji: '🎯', priority: 'medium' });
      } catch {}
      setLoading(false);
    } else if (currentStep === 'celebration') {
      await api.updateOnboarding({ onboarding_complete: true });
      await refreshUser();
      router.replace('/(tabs)/dashboard');
      return;
    }
    next();
  };

  const renderProgress = () => (
    <View style={styles.progressContainer}>
      {STEPS.map((_, i) => (
        <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
      ))}
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <View style={styles.stepContent} testID="onboarding-welcome">
            <Text style={styles.bigEmoji}>✨</Text>
            <Text style={styles.title}>Welcome to TASKLY!</Text>
            <Text style={styles.desc}>
              Your personal task adventure begins now.{'\n'}Every task you complete earns XP and keeps your streak alive!
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.feature}>🎯 Smart task management</Text>
              <Text style={styles.feature}>🤖 AI-powered assistance</Text>
              <Text style={styles.feature}>🔥 Streaks & rewards</Text>
              <Text style={styles.feature}>🏆 Badges & achievements</Text>
            </View>
          </View>
        );

      case 'name':
        return (
          <View style={styles.stepContent} testID="onboarding-name">
            <Text style={styles.bigEmoji}>👋</Text>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.desc}>We'll use this to personalize your experience</Text>
            <TextInput
              testID="onboarding-name-input"
              style={styles.bigInput}
              placeholder="Type your name..."
              placeholderTextColor={COLORS.light.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />
          </View>
        );

      case 'purpose':
        return (
          <View style={styles.stepContent} testID="onboarding-purpose">
            <Text style={styles.bigEmoji}>🎯</Text>
            <Text style={styles.title}>How will you use Taskly?</Text>
            <Text style={styles.desc}>We'll customize your experience</Text>
            <View style={styles.optionGrid}>
              {PURPOSES.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  testID={`purpose-${p.id}`}
                  style={[styles.optionCard, purpose === p.id && styles.optionCardSelected]}
                  onPress={() => setPurpose(p.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{p.emoji}</Text>
                  <Text style={[styles.optionLabel, purpose === p.id && styles.optionLabelSelected]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'mascot':
        return (
          <View style={styles.stepContent} testID="onboarding-mascot">
            <Text style={styles.bigEmoji}>🎭</Text>
            <Text style={styles.title}>Choose your AI mascot!</Text>
            <Text style={styles.desc}>They'll cheer you on and keep you motivated</Text>
            <View style={styles.mascotGrid}>
              {Object.entries(MASCOTS).map(([key, m]) => (
                <TouchableOpacity
                  key={key}
                  testID={`mascot-${key}`}
                  style={[styles.mascotCard, mascot === key && styles.mascotCardSelected]}
                  onPress={() => setMascot(key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mascotEmoji}>{m.emoji}</Text>
                  <Text style={[styles.mascotName, mascot === key && styles.mascotNameSelected]}>{m.name}</Text>
                  <Text style={styles.mascotTone}>{m.tone}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'notifications':
        return (
          <View style={styles.stepContent} testID="onboarding-notifications">
            <Text style={styles.bigEmoji}>🔔</Text>
            <Text style={styles.title}>How often should we nudge you?</Text>
            <Text style={styles.desc}>You can always change this later</Text>
            <View style={styles.notifOptions}>
              {NOTIF_STYLES.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  testID={`notif-${n.id}`}
                  style={[styles.notifCard, notifStyle === n.id && styles.notifCardSelected]}
                  onPress={() => setNotifStyle(n.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.notifEmoji}>{n.emoji}</Text>
                  <View style={styles.notifTextContainer}>
                    <Text style={[styles.notifLabel, notifStyle === n.id && styles.notifLabelSelected]}>{n.label}</Text>
                    <Text style={styles.notifDesc}>{n.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'first_task':
        return (
          <View style={styles.stepContent} testID="onboarding-first-task">
            <Text style={styles.bigEmoji}>🚀</Text>
            <Text style={styles.title}>Create your first task!</Text>
            <Text style={styles.desc}>What's something you want to get done?</Text>
            <TextInput
              testID="first-task-input"
              style={styles.bigInput}
              placeholder="e.g., Finish my homework..."
              placeholderTextColor={COLORS.light.textTertiary}
              value={firstTask}
              onChangeText={setFirstTask}
              autoFocus
            />
          </View>
        );

      case 'celebration':
        return (
          <View style={styles.stepContent} testID="onboarding-celebration">
            <Text style={styles.bigEmoji}>🎉</Text>
            <Text style={styles.title}>You're all set!</Text>
            <Text style={styles.desc}>
              Your adventure begins now.{'\n'}Let's start your streak today!
            </Text>
            <View style={styles.celebrationStats}>
              <View style={styles.celebStat}>
                <Text style={styles.celebStatValue}>🔥 0</Text>
                <Text style={styles.celebStatLabel}>Day Streak</Text>
              </View>
              <View style={styles.celebStat}>
                <Text style={styles.celebStatValue}>⭐ 0</Text>
                <Text style={styles.celebStatLabel}>XP Earned</Text>
              </View>
              <View style={styles.celebStat}>
                <Text style={styles.celebStatValue}>📝 1</Text>
                <Text style={styles.celebStatLabel}>Task Created</Text>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {renderProgress()}
        {renderStep()}
        <TouchableOpacity
          testID="onboarding-next-btn"
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.nextBtnText}>
              {currentStep === 'celebration' ? "Let's Go! 🚀" : currentStep === 'welcome' ? "Get Started" : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
        {step > 0 && currentStep !== 'celebration' && (
          <TouchableOpacity testID="onboarding-back-btn" onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.light.background },
  scroll: { flexGrow: 1, padding: SPACING.lg, justifyContent: 'center' },
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: SPACING.xl },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.light.border },
  progressDotActive: { backgroundColor: COLORS.primary, width: 24 },
  stepContent: { alignItems: 'center', marginBottom: SPACING.xl },
  bigEmoji: { fontSize: 64, marginBottom: SPACING.md },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.light.text, textAlign: 'center', marginBottom: SPACING.sm },
  desc: { fontSize: 16, color: COLORS.light.textSecondary, textAlign: 'center', lineHeight: 24 },
  featureList: { marginTop: SPACING.lg, alignSelf: 'stretch' },
  feature: { fontSize: 17, color: COLORS.light.text, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, backgroundColor: COLORS.light.surface, borderRadius: RADIUS.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  bigInput: {
    width: '100%',
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: 20,
    color: COLORS.light.text,
    marginTop: SPACING.lg,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
    ...SHADOWS.sm,
  },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: SPACING.lg, width: '100%' },
  optionCard: {
    width: '45%',
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  optionCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  optionEmoji: { fontSize: 32, marginBottom: SPACING.sm },
  optionLabel: { fontSize: 16, fontWeight: '700', color: COLORS.light.text },
  optionLabelSelected: { color: COLORS.primary },
  mascotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: SPACING.lg, width: '100%' },
  mascotCard: {
    width: '45%',
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  mascotCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  mascotEmoji: { fontSize: 40, marginBottom: SPACING.xs },
  mascotName: { fontSize: 15, fontWeight: '700', color: COLORS.light.text },
  mascotNameSelected: { color: COLORS.primary },
  mascotTone: { fontSize: 12, color: COLORS.light.textTertiary, textAlign: 'center', marginTop: 2 },
  notifOptions: { width: '100%', marginTop: SPACING.lg, gap: 12 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.sm,
  },
  notifCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  notifEmoji: { fontSize: 32, marginRight: SPACING.md },
  notifTextContainer: { flex: 1 },
  notifLabel: { fontSize: 17, fontWeight: '700', color: COLORS.light.text },
  notifLabelSelected: { color: COLORS.primary },
  notifDesc: { fontSize: 13, color: COLORS.light.textTertiary, marginTop: 2 },
  celebrationStats: { flexDirection: 'row', marginTop: SPACING.xl, gap: 16 },
  celebStat: { alignItems: 'center', backgroundColor: COLORS.light.surface, borderRadius: RADIUS.lg, padding: SPACING.md, flex: 1, ...SHADOWS.sm },
  celebStatValue: { fontSize: 24, fontWeight: '800' },
  celebStatLabel: { fontSize: 12, color: COLORS.light.textSecondary, marginTop: 4 },
  nextBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 4,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  backBtn: { alignItems: 'center', marginTop: SPACING.md },
  backBtnText: { color: COLORS.light.textSecondary, fontSize: 15 },
});
