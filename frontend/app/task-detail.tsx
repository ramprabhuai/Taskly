import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, PRIORITIES } from '../src/utils/constants';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      const data = await api.getTask(id!);
      setTask(data);
    } catch (e) { console.log('Task load error:', e); }
    finally { setLoading(false); }
  };

  const handleComplete = async () => {
    await api.updateTask(id!, { completed: true });
    router.back();
  };

  const handleDelete = async () => {
    await api.deleteTask(id!);
    router.back();
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    await api.toggleSubtask(id!, subtaskId);
    loadTask();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]}>
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]}>
        <View style={styles.center}><Text style={{ color: isDark ? COLORS.dark.text : COLORS.light.text }}>Task not found</Text></View>
      </SafeAreaView>
    );
  }

  const priorityInfo = PRIORITIES[task.priority as keyof typeof PRIORITIES];
  const completedSubtasks = (task.subtasks || []).filter((s: any) => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="task-detail-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-task-btn" onPress={handleDelete}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.emoji}>{task.emoji || '📝'}</Text>
          <Text style={[styles.title, task.completed && styles.titleDone, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{task.title}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: (priorityInfo?.color || '#999') + '15' }]}>
            <Text style={{ color: priorityInfo?.color || '#999', fontSize: 13, fontWeight: '700' }}>
              {priorityInfo?.emoji} {task.priority}
            </Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: COLORS.primary + '15' }]}>
            <Text style={{ color: COLORS.primary, fontSize: 13, fontWeight: '700' }}>⏱ {task.estimated_time}min</Text>
          </View>
          <View style={[styles.metaChip, { backgroundColor: COLORS.warning + '15' }]}>
            <Text style={{ color: COLORS.warning, fontSize: 13, fontWeight: '700' }}>📁 {task.category}</Text>
          </View>
        </View>

        {task.description ? (
          <View style={[styles.descCard, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }]}>
            <Text style={[styles.descText, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{task.description}</Text>
          </View>
        ) : null}

        {task.xp_earned > 0 && (
          <View style={[styles.xpBadge, { backgroundColor: COLORS.success + '15' }]}>
            <Text style={{ color: COLORS.success, fontSize: 15, fontWeight: '800' }}>⭐ {task.xp_earned} XP earned!</Text>
          </View>
        )}

        {/* Subtasks */}
        {totalSubtasks > 0 && (
          <View style={styles.subtasksSection}>
            <View style={styles.subtaskHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Subtasks</Text>
              <Text style={[styles.subtaskCount, { color: COLORS.primary }]}>{completedSubtasks}/{totalSubtasks}</Text>
            </View>
            <View style={styles.subtaskProgress}>
              <View style={[styles.subtaskProgressFill, { width: `${totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0}%` }]} />
            </View>
            {task.subtasks.map((st: any) => (
              <TouchableOpacity
                key={st.subtask_id}
                testID={`subtask-${st.subtask_id}`}
                style={[styles.subtaskItem, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }]}
                onPress={() => handleToggleSubtask(st.subtask_id)}
              >
                <View style={[styles.subtaskCheck, st.completed && styles.subtaskCheckDone]}>
                  {st.completed && <Text style={styles.subtaskCheckmark}>✓</Text>}
                </View>
                <Text style={[styles.subtaskTitle, st.completed && styles.subtaskTitleDone, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>
                  {st.title}
                </Text>
                <Text style={[styles.subtaskTime, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>{st.estimated_time}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {!task.completed && (
        <View style={styles.footer}>
          <TouchableOpacity testID="complete-btn" style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.8}>
            <Text style={styles.completeBtnText}>Complete Task ✨</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { padding: 8 },
  backText: { fontSize: 16, fontWeight: '600' },
  deleteText: { fontSize: 20 },
  scroll: { padding: SPACING.md },
  titleSection: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: SPACING.md },
  emoji: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '900', flex: 1 },
  titleDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.md, flexWrap: 'wrap' },
  metaChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  descCard: { borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  descText: { fontSize: 15, lineHeight: 22 },
  xpBadge: { borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.md },
  subtasksSection: { marginTop: SPACING.sm },
  subtaskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  subtaskCount: { fontSize: 15, fontWeight: '800' },
  subtaskProgress: { height: 6, backgroundColor: 'rgba(108,58,255,0.15)', borderRadius: 3, marginBottom: SPACING.sm },
  subtaskProgressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  subtaskItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, marginBottom: 6, gap: 10 },
  subtaskCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.primary + '50', alignItems: 'center', justifyContent: 'center' },
  subtaskCheckDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  subtaskCheckmark: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  subtaskTitle: { flex: 1, fontSize: 15, fontWeight: '600' },
  subtaskTitleDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  subtaskTime: { fontSize: 13 },
  footer: { padding: SPACING.md, paddingBottom: SPACING.lg },
  completeBtn: { backgroundColor: COLORS.success, borderRadius: RADIUS.lg, padding: SPACING.md + 2, alignItems: 'center', ...SHADOWS.md },
  completeBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
