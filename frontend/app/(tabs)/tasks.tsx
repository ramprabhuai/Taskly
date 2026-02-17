import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, PRIORITIES } from '../../src/utils/constants';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'today', label: 'Today' },
  { id: 'completed', label: 'Done' },
];

export default function TasksScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const data = await api.getTasks(filter);
      setTasks(data);
    } catch (e) { console.log('Tasks load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { setLoading(true); loadTasks(); }, [loadTasks]);

  const handleComplete = async (taskId: string) => {
    await api.updateTask(taskId, { completed: true });
    loadTasks();
  };

  const handleDelete = async (taskId: string) => {
    await api.deleteTask(taskId);
    loadTasks();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="tasks-screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>My Tasks</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            testID={`filter-${f.id}`}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTasks(); }} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={[styles.emptyText, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>
              {filter === 'completed' ? 'No completed tasks yet!' : 'No tasks here. Tap + to create one!'}
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <TouchableOpacity
              key={task.task_id}
              testID={`task-item-${task.task_id}`}
              style={[styles.taskCard, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }, SHADOWS.sm]}
              onPress={() => router.push({ pathname: '/task-detail', params: { id: task.task_id } })}
              activeOpacity={0.7}
            >
              <TouchableOpacity
                testID={`check-${task.task_id}`}
                style={[styles.checkbox, task.completed && styles.checkboxDone]}
                onPress={() => !task.completed && handleComplete(task.task_id)}
              >
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone, { color: isDark ? COLORS.dark.text : COLORS.light.text }]} numberOfLines={1}>
                  {task.emoji || '📝'} {task.title}
                </Text>
                <View style={styles.taskMeta}>
                  <View style={[styles.priorityTag, { backgroundColor: (PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color || '#999') + '20' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color || '#999' }}>
                      {task.priority}
                    </Text>
                  </View>
                  {task.estimated_time > 0 && (
                    <Text style={[styles.metaText, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>⏱ {task.estimated_time}m</Text>
                  )}
                  {task.subtasks?.length > 0 && (
                    <Text style={[styles.metaText, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>
                      ✅ {task.subtasks.filter((s: any) => s.completed).length}/{task.subtasks.length}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity testID={`delete-${task.task_id}`} onPress={() => handleDelete(task.task_id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.sm },
  title: { fontSize: 28, fontWeight: '900' },
  filterScroll: { maxHeight: 50, marginTop: SPACING.sm },
  filterContainer: { paddingHorizontal: SPACING.md, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(108,58,255,0.08)' },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  filterTextActive: { color: '#FFF' },
  scroll: { padding: SPACING.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, textAlign: 'center' },
  taskCard: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: COLORS.primary + '50', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '700' },
  taskTitleDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  taskMeta: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
  priorityTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  metaText: { fontSize: 12 },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 16 },
});
