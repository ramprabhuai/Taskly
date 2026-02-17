import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, PRIORITIES, MASCOTS } from '../../src/utils/constants';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (e) {
      console.log('Dashboard load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const onRefresh = () => { setRefreshing(true); loadDashboard(); };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  const mascotEmoji = MASCOTS[dashboard?.mascot as keyof typeof MASCOTS]?.emoji || '🦉';
  const xpForLevel = (dashboard?.level || 1) * 100;
  const xpProgress = ((dashboard?.xp || 0) % 100) / 100;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="dashboard-screen">
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>
              {dashboard?.greeting || 'Hello'} {mascotEmoji}
            </Text>
            <Text style={[styles.name, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>
              {dashboard?.name || 'Friend'}!
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity testID="dark-mode-toggle" onPress={toggleTheme} style={styles.iconBtn}>
              <Text style={styles.iconEmoji}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="notifications-btn" onPress={() => router.push('/notifications')} style={styles.iconBtn}>
              <Text style={styles.iconEmoji}>🔔</Text>
              {(dashboard?.unread_notifications || 0) > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{dashboard.unread_notifications}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')} style={styles.iconBtn}>
              <Text style={styles.iconEmoji}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Streak & XP Bar */}
        <View style={[styles.xpCard, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }, SHADOWS.md]}>
          <View style={styles.xpRow}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={[styles.streakNum, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{dashboard?.streak || 0}</Text>
              <Text style={[styles.streakLabel, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={styles.xpInfo}>
              <View style={styles.xpLevelRow}>
                <Text style={[styles.xpText, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Level {dashboard?.level || 1}</Text>
                <Text style={[styles.xpAmount, { color: COLORS.primary }]}>{dashboard?.xp || 0} XP</Text>
              </View>
              <View style={styles.xpBarBg}>
                <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` }]} />
              </View>
              <Text style={[styles.xpToNext, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>
                {100 - ((dashboard?.xp || 0) % 100)} XP to next level
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
            <Text style={styles.statValue}>{dashboard?.completed_today || 0}</Text>
            <Text style={[styles.statLabel, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>Done Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
            <Text style={styles.statValue}>{dashboard?.total_pending || 0}</Text>
            <Text style={[styles.statLabel, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
            <Text style={styles.statValue}>⭐</Text>
            <Text style={[styles.statLabel, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>Lvl {dashboard?.level || 1}</Text>
          </View>
        </View>

        {/* Today's Focus */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Today's Focus</Text>
          {(!dashboard?.today_tasks || dashboard.today_tasks.length === 0) ? (
            <View style={[styles.emptyCard, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }]}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={[styles.emptyText, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>
                No tasks yet! Tap + to add your first task
              </Text>
            </View>
          ) : (
            dashboard.today_tasks.map((task: any) => (
              <TouchableOpacity
                key={task.task_id}
                testID={`task-card-${task.task_id}`}
                style={[styles.taskCard, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }, SHADOWS.sm]}
                onPress={() => router.push({ pathname: '/task-detail', params: { id: task.task_id } })}
                activeOpacity={0.7}
              >
                <View style={styles.taskLeft}>
                  <Text style={styles.taskEmoji}>{task.emoji || '📝'}</Text>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]} numberOfLines={1}>
                      {task.title}
                    </Text>
                    <View style={styles.taskMeta}>
                      <View style={[styles.priorityBadge, { backgroundColor: PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color + '20' }]}>
                        <Text style={[styles.priorityText, { color: PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color }]}>
                          {PRIORITIES[task.priority as keyof typeof PRIORITIES]?.emoji} {task.priority}
                        </Text>
                      </View>
                      {task.due_date && <Text style={[styles.dueText, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>📅 {new Date(task.due_date).toLocaleDateString()}</Text>}
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  testID={`complete-task-${task.task_id}`}
                  style={styles.completeBtn}
                  onPress={async (e) => {
                    e.stopPropagation();
                    await api.updateTask(task.task_id, { completed: true });
                    loadDashboard();
                  }}
                >
                  <Text style={styles.completeBtnText}>✓</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Motivational Quote */}
        {dashboard?.quote && (
          <View style={[styles.quoteCard, { backgroundColor: COLORS.primary + '10' }]}>
            <Text style={styles.quoteIcon}>💡</Text>
            <Text style={[styles.quoteText, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>"{dashboard.quote}"</Text>
          </View>
        )}

        {/* AI Assistant Shortcut */}
        <TouchableOpacity
          testID="ai-shortcut-btn"
          style={[styles.aiCard, SHADOWS.md]}
          onPress={() => router.push('/(tabs)/ai-assistant')}
          activeOpacity={0.8}
        >
          <Text style={styles.aiEmoji}>🤖</Text>
          <View style={styles.aiTextContainer}>
            <Text style={styles.aiTitle}>Your AI Assistant</Text>
            <Text style={styles.aiDesc}>Need help? Ask me anything!</Text>
          </View>
          <Text style={styles.aiArrow}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  headerLeft: {},
  greeting: { fontSize: 14, fontWeight: '600' },
  name: { fontSize: 26, fontWeight: '900' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(108,58,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 18 },
  badge: { position: 'absolute', top: -2, right: -2, backgroundColor: COLORS.accent, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  xpCard: { borderRadius: RADIUS.xl, padding: SPACING.md },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  streakBadge: { alignItems: 'center', minWidth: 60 },
  streakEmoji: { fontSize: 32 },
  streakNum: { fontSize: 24, fontWeight: '900' },
  streakLabel: { fontSize: 11, fontWeight: '600' },
  xpInfo: { flex: 1 },
  xpLevelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpText: { fontSize: 15, fontWeight: '700' },
  xpAmount: { fontSize: 15, fontWeight: '800' },
  xpBarBg: { height: 10, backgroundColor: 'rgba(108,58,255,0.15)', borderRadius: 5 },
  xpBarFill: { height: 10, backgroundColor: COLORS.primary, borderRadius: 5 },
  xpToNext: { fontSize: 11, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: SPACING.md },
  statCard: { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  section: { marginTop: SPACING.lg },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: SPACING.sm },
  emptyCard: { borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center' },
  emptyEmoji: { fontSize: 40, marginBottom: SPACING.sm },
  emptyText: { fontSize: 15, textAlign: 'center' },
  taskCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  taskLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  taskEmoji: { fontSize: 28, marginRight: SPACING.sm },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '700' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  priorityBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  priorityText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  dueText: { fontSize: 11 },
  completeBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },
  completeBtnText: { color: COLORS.success, fontSize: 18, fontWeight: '800' },
  quoteCard: { borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  quoteIcon: { fontSize: 24, marginRight: SPACING.sm },
  quoteText: { flex: 1, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  aiCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md },
  aiEmoji: { fontSize: 32, marginRight: SPACING.sm },
  aiTextContainer: { flex: 1 },
  aiTitle: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  aiDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  aiArrow: { color: '#FFF', fontSize: 24, fontWeight: '300' },
});
