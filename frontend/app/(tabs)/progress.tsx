import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../src/utils/constants';

export default function ProgressScreen() {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await api.getGamificationStats();
      setStats(data);
    } catch (e) { console.log('Stats error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadStats(); }, []);

  const getLevelTitle = (level: number) => {
    if (level <= 2) return 'Beginner';
    if (level <= 5) return 'Apprentice';
    if (level <= 10) return 'Warrior';
    if (level <= 20) return 'Expert';
    return 'Master';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="progress-screen">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Your Progress</Text>

        {/* Main Stats Card */}
        <View style={[styles.mainCard, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }, SHADOWS.md]}>
          <View style={styles.levelContainer}>
            <Text style={styles.levelEmoji}>⭐</Text>
            <Text style={[styles.levelNum, { color: COLORS.primary }]}>Level {stats?.level || 1}</Text>
            <Text style={[styles.levelTitle, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>{getLevelTitle(stats?.level || 1)}</Text>
          </View>
          <View style={styles.mainStatsRow}>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatEmoji}>🔥</Text>
              <Text style={[styles.mainStatValue, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{stats?.streak || 0}</Text>
              <Text style={[styles.mainStatLabel, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatEmoji}>💎</Text>
              <Text style={[styles.mainStatValue, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{stats?.xp || 0}</Text>
              <Text style={[styles.mainStatLabel, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>Total XP</Text>
            </View>
            <View style={styles.mainStat}>
              <Text style={styles.mainStatEmoji}>✅</Text>
              <Text style={[styles.mainStatValue, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{stats?.total_completed || 0}</Text>
              <Text style={[styles.mainStatLabel, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Weekly Activity */}
        <Text style={[styles.sectionTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>This Week</Text>
        <View style={[styles.weekCard, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }, SHADOWS.sm]}>
          <View style={styles.weekRow}>
            {(stats?.week_activity || []).map((day: any, i: number) => (
              <View key={i} style={styles.dayCol}>
                <View style={[styles.dayBar, { height: Math.max(8, (day.count || 0) * 20), backgroundColor: day.count > 0 ? COLORS.primary : (isDark ? COLORS.dark.border : COLORS.light.border) }]} />
                <Text style={[styles.dayLabel, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>{day.day}</Text>
                <Text style={[styles.dayCount, { color: day.count > 0 ? COLORS.primary : (isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary) }]}>{day.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Badges */}
        <Text style={[styles.sectionTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Badges</Text>
        <View style={styles.badgeGrid}>
          {(stats?.all_badges || []).map((badge: any, i: number) => {
            const earned = (stats?.badges || []).find((b: any) => b.badge_type === badge.badge_type);
            return (
              <View key={i} style={[styles.badgeCard, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface, opacity: earned ? 1 : 0.4 }, SHADOWS.sm]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[styles.badgeName, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{badge.name}</Text>
                <Text style={[styles.badgeDesc, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>{badge.description}</Text>
                {earned && <Text style={styles.badgeEarned}>Earned! ✓</Text>}
              </View>
            );
          })}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SPACING.md },
  title: { fontSize: 28, fontWeight: '900', marginBottom: SPACING.md },
  mainCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center' },
  levelContainer: { alignItems: 'center', marginBottom: SPACING.md },
  levelEmoji: { fontSize: 48 },
  levelNum: { fontSize: 28, fontWeight: '900', marginTop: 4 },
  levelTitle: { fontSize: 14, fontWeight: '700' },
  mainStatsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around' },
  mainStat: { alignItems: 'center' },
  mainStatEmoji: { fontSize: 28 },
  mainStatValue: { fontSize: 24, fontWeight: '900' },
  mainStatLabel: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  weekCard: { borderRadius: RADIUS.lg, padding: SPACING.md },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 100 },
  dayCol: { alignItems: 'center', flex: 1 },
  dayBar: { width: 20, borderRadius: 10, minHeight: 8, marginBottom: 4 },
  dayLabel: { fontSize: 11, fontWeight: '600' },
  dayCount: { fontSize: 12, fontWeight: '800' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { width: '47%', borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  badgeIcon: { fontSize: 36 },
  badgeName: { fontSize: 14, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  badgeDesc: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  badgeEarned: { color: COLORS.success, fontSize: 12, fontWeight: '700', marginTop: 4 },
});
