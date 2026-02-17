import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, MASCOTS, AI_MODELS } from '../src/utils/constants';

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="settings-screen">
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
              <Text style={[styles.profileLevel, { color: COLORS.primary }]}>Level {user?.level || 1} • {user?.xp || 0} XP</Text>
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
});
