import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, MASCOTS, AI_MODELS } from '../src/utils/constants';
import { BadgeUnlockPopup } from '../src/components/Animations';

const BADGE_OPTIONS = [
  { badge_type: 'first_task', name: 'First Steps', icon: '🎯', description: 'Complete your first task' },
  { badge_type: 'streak_3', name: 'On Fire', icon: '🔥', description: '3-day streak' },
  { badge_type: 'xp_100', name: 'Century Club', icon: '💯', description: 'Earn 100 XP' },
  { badge_type: 'task_10', name: 'Task Master', icon: '⚡', description: 'Complete 10 tasks' },
  { badge_type: 'early_bird', name: 'Early Bird', icon: '🌅', description: 'Complete a task before 9am' },
  { badge_type: 'night_owl', name: 'Night Owl', icon: '🌙', description: 'Complete a task after 9pm' },
  { badge_type: 'consistency_king', name: 'Consistency King', icon: '👑', description: '7-day streak' },
  { badge_type: 'zero_inbox', name: 'Zero Inbox', icon: '🏆', description: 'Clear all tasks in a day' },
  { badge_type: 'speed_runner', name: 'Speed Runner', icon: '⚡', description: 'Finish faster than estimate' },
];

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [devLoading, setDevLoading] = useState('');

  const handleMascotChange = async (mascot: string) => {
    await api.updateProfile({ mascot });
    await refreshUser();
  };

  const handleAIChange = async (aiPref: string) => {
    await api.updateProfile({ ai_preference: aiPref });
    await refreshUser();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth');
  };

  // Bug 2: Dev Tools functions
  const devSimulateNextDay = async () => {
    setDevLoading('streak');
    try {
      await api.fetch('/dev/simulate-day', { method: 'POST' });
      await refreshUser();
    } catch (e) { console.log('Dev error:', e); }
    setDevLoading('');
  };

  const devResetStreak = async () => {
    setDevLoading('reset');
    try {
      await api.fetch('/dev/reset-streak', { method: 'POST' });
      await refreshUser();
    } catch (e) { console.log('Dev error:', e); }
    setDevLoading('');
  };

  const devAddXP = async () => {
    setDevLoading('xp');
    try {
      await api.fetch('/dev/add-xp', { method: 'POST', body: JSON.stringify({ xp: 50 }) });
      await refreshUser();
    } catch (e) { console.log('Dev error:', e); }
    setDevLoading('');
  };

  const devTriggerBadge = async (badge: any) => {
    try {
      await api.fetch('/dev/trigger-badge', { method: 'POST', body: JSON.stringify({ badge_type: badge.badge_type }) });
      setSelectedBadge(badge);
      setShowBadgePopup(true);
      await refreshUser();
    } catch (e) { console.log('Dev error:', e); }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="settings-screen">
      <BadgeUnlockPopup visible={showBadgePopup} badge={selectedBadge} onDismiss={() => { setShowBadgePopup(false); setSelectedBadge(null); }} />

      <View style={styles.header}>
        <TouchableOpacity testID="settings-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={[styles.card, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }, SHADOWS.sm]}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>{MASCOTS[user?.mascot as keyof typeof MASCOTS]?.emoji || '🦉'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{user?.name || 'User'}</Text>
              <Text style={[styles.profileEmail, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>{user?.email || ''}</Text>
              <Text style={[styles.profileLevel, { color: COLORS.primary }]}>Level {user?.level || 1} • {user?.xp || 0} XP • 🔥 {user?.streak || 0} Streak</Text>
            </View>
          </View>
        </View>

        {/* Dark Mode */}
        <Text style={[styles.sectionTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Appearance</Text>
        <TouchableOpacity
          testID="dark-mode-setting"
          style={[styles.settingRow, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }, SHADOWS.sm]}
          onPress={toggleTheme}
        >
          <Text style={styles.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
          <Text style={[styles.settingLabel, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Dark Mode</Text>
          <View style={[styles.toggle, isDark && styles.toggleOn]}>
            <View style={[styles.toggleThumb, isDark && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>

        {/* Mascot */}
        <Text style={[styles.sectionTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Your Mascot</Text>
        <View style={styles.mascotRow}>
          {Object.entries(MASCOTS).map(([key, m]) => (
            <TouchableOpacity
              key={key}
              testID={`settings-mascot-${key}`}
              style={[
                styles.mascotCard,
                { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface },
                user?.mascot === key && styles.mascotCardActive,
              ]}
              onPress={() => handleMascotChange(key)}
            >
              <Text style={styles.mascotEmoji}>{m.emoji}</Text>
              <Text style={[styles.mascotName, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Preference */}
        <Text style={[styles.sectionTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Default AI Model</Text>
        {Object.entries(AI_MODELS).map(([key, m]) => (
          <TouchableOpacity
            key={key}
            testID={`settings-ai-${key}`}
            style={[
              styles.settingRow,
              { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface },
              user?.ai_preference === key && { borderColor: m.color, borderWidth: 2 },
              SHADOWS.sm,
            ]}
            onPress={() => handleAIChange(key)}
          >
            <Text style={styles.settingIcon}>{m.icon}</Text>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{m.name}</Text>
              <Text style={[styles.settingDesc, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>{m.description}</Text>
            </View>
            {user?.ai_preference === key && <Text style={[styles.activeCheck, { color: m.color }]}>✓</Text>}
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Bug 2: Developer Tools */}
        <View style={styles.devSection}>
          <Text style={styles.devTitle}>🛠 Developer Tools</Text>
          <Text style={styles.devSubtitle}>For testing purposes only</Text>

          <View style={styles.devRow}>
            <TouchableOpacity
              testID="dev-simulate-day"
              style={[styles.devBtn, devLoading === 'streak' && styles.devBtnLoading]}
              onPress={devSimulateNextDay}
              disabled={!!devLoading}
            >
              <Text style={styles.devBtnText}>🔥 Simulate Next Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="dev-reset-streak"
              style={[styles.devBtn, devLoading === 'reset' && styles.devBtnLoading]}
              onPress={devResetStreak}
              disabled={!!devLoading}
            >
              <Text style={styles.devBtnText}>↩️ Reset Streak</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID="dev-add-xp"
            style={[styles.devBtn, styles.devBtnFull, devLoading === 'xp' && styles.devBtnLoading]}
            onPress={devAddXP}
            disabled={!!devLoading}
          >
            <Text style={styles.devBtnText}>⭐ Add 50 XP</Text>
          </TouchableOpacity>

          <Text style={styles.devBadgeTitle}>Trigger Badge Unlock:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.devBadgeScroll}>
            {BADGE_OPTIONS.map((b) => (
              <TouchableOpacity
                key={b.badge_type}
                testID={`dev-badge-${b.badge_type}`}
                style={styles.devBadgeChip}
                onPress={() => devTriggerBadge(b)}
              >
                <Text style={styles.devBadgeIcon}>{b.icon}</Text>
                <Text style={styles.devBadgeName}>{b.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { padding: 8 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800' },
  scroll: { padding: SPACING.md },
  card: { borderRadius: RADIUS.xl, padding: SPACING.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 32 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '800' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profileLevel: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, gap: 12 },
  settingIcon: { fontSize: 22 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: '700' },
  settingDesc: { fontSize: 12, marginTop: 2 },
  activeCheck: { fontSize: 20, fontWeight: '800' },
  toggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#DDD', justifyContent: 'center', padding: 3 },
  toggleOn: { backgroundColor: COLORS.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  mascotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mascotCard: { width: '22%', borderRadius: RADIUS.lg, padding: SPACING.sm, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  mascotCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  mascotEmoji: { fontSize: 28 },
  mascotName: { fontSize: 10, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  logoutBtn: { marginTop: SPACING.xl, backgroundColor: COLORS.accent + '15', borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  logoutText: { color: COLORS.accent, fontSize: 16, fontWeight: '700' },
  // Dev Tools styles
  devSection: { marginTop: SPACING.xl, paddingTop: SPACING.lg, borderTopWidth: 1, borderTopColor: '#E5E7EB30' },
  devTitle: { fontSize: 14, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },
  devSubtitle: { fontSize: 11, color: '#D1D5DB', textAlign: 'center', marginTop: 2, marginBottom: SPACING.md },
  devRow: { flexDirection: 'row', gap: 8 },
  devBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', marginBottom: 8 },
  devBtnFull: { flex: undefined, width: '100%' },
  devBtnLoading: { opacity: 0.5 },
  devBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  devBadgeTitle: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginTop: SPACING.sm, marginBottom: SPACING.xs },
  devBadgeScroll: { marginBottom: SPACING.md },
  devBadgeChip: { alignItems: 'center', marginRight: 10, backgroundColor: '#F3F4F6', borderRadius: RADIUS.md, padding: 8, minWidth: 64 },
  devBadgeIcon: { fontSize: 24 },
  devBadgeName: { fontSize: 9, fontWeight: '600', color: '#6B7280', marginTop: 2 },
});
