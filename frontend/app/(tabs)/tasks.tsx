import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, PRIORITIES } from '../../src/utils/constants';

// Due date badge colors
const DUE_COLORS = {
  overdue: '#FF4757',
  today: '#FF6B6B',
  tomorrow: '#FFB020',
  thisWeek: '#6C3AFF',
  later: '#9CA3AF',
};

// Filter chips for due date filtering
const FILTERS = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'pending', label: 'Pending', icon: '⏳' },
  { id: 'completed', label: 'Done', icon: '✅' },
  { id: 'today', label: 'Today', icon: '📅' },
  { id: 'overdue', label: 'Overdue', icon: '⚠️' },
];

// Helper to get due date status
const getDueDateStatus = (dueDate: string | null): { status: string; label: string; color: string; time?: string } | null => {
  if (!dueDate) return null;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const due = new Date(dueDate);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  
  // Format time if available
  const hours = due.getHours();
  const minutes = due.getMinutes();
  const hasTime = hours !== 0 || minutes !== 0;
  const timeStr = hasTime ? `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}` : '';
  
  if (dueDay < today) {
    return { status: 'overdue', label: 'Overdue', color: DUE_COLORS.overdue };
  }
  if (dueDay.getTime() === today.getTime()) {
    return { status: 'today', label: timeStr ? `Today ${timeStr}` : 'Today', color: DUE_COLORS.today, time: timeStr };
  }
  if (dueDay.getTime() === tomorrow.getTime()) {
    return { status: 'tomorrow', label: 'Tomorrow', color: DUE_COLORS.tomorrow };
  }
  if (dueDay < weekEnd) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return { status: 'thisWeek', label: days[due.getDay()], color: DUE_COLORS.thisWeek };
  }
  
  // Later
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return { status: 'later', label: `${months[due.getMonth()]} ${due.getDate()}`, color: DUE_COLORS.later };
};

// Sort priority: overdue > today > tomorrow > thisWeek > later > no date
const sortByDueDate = (tasks: any[]): any[] => {
  const priority: Record<string, number> = { overdue: 0, today: 1, tomorrow: 2, thisWeek: 3, later: 4, none: 5 };
  
  return [...tasks].sort((a, b) => {
    const statusA = getDueDateStatus(a.due_date);
    const statusB = getDueDateStatus(b.due_date);
    
    const prioA = statusA ? priority[statusA.status] : priority.none;
    const prioB = statusB ? priority[statusB.status] : priority.none;
    
    if (prioA !== prioB) return prioA - prioB;
    
    // Secondary sort by due date for same priority
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return 0;
  });
};

export default function TasksScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState(params.filter || 'all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Update filter when route param changes
  useEffect(() => {
    if (params.filter) {
      setFilter(params.filter);
    }
  }, [params.filter]);

  const loadTasks = useCallback(async () => {
    try {
      // Fetch all tasks (both active and completed)
      const [activeTasks, completedTasks] = await Promise.all([
        api.getTasks('active'),
        api.getTasks('completed'),
      ]);
      setAllTasks([...activeTasks, ...completedTasks]);
    } catch (e) { console.log('Tasks load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { setLoading(true); loadTasks(); }, [loadTasks]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = allTasks;
    
    // Apply filter
    if (filter === 'pending') {
      result = allTasks.filter(t => !t.completed);
    } else if (filter === 'completed') {
      result = allTasks.filter(t => t.completed);
    } else if (filter === 'today') {
      result = allTasks.filter(t => {
        if (t.completed) return false;
        const status = getDueDateStatus(t.due_date);
        return status?.status === 'today';
      });
    } else if (filter === 'overdue') {
      result = allTasks.filter(t => {
        if (t.completed) return false;
        const status = getDueDateStatus(t.due_date);
        return status?.status === 'overdue';
      });
    } else if (filter === 'all') {
      result = allTasks.filter(t => !t.completed); // Default: show active only
    }
    
    // Sort by due date priority
    return sortByDueDate(result);
  }, [allTasks, filter]);

  const handleComplete = async (taskId: string) => {
    await api.updateTask(taskId, { completed: true });
    loadTasks();
  };

  const handleDelete = async (taskId: string) => {
    await api.deleteTask(taskId);
    loadTasks();
  };

  const getFilterCount = (filterId: string): number => {
    if (filterId === 'all') return tasks.length;
    if (filterId === 'today') return tasks.filter(t => getDueDateStatus(t.due_date)?.status === 'today').length;
    if (filterId === 'tomorrow') return tasks.filter(t => getDueDateStatus(t.due_date)?.status === 'tomorrow').length;
    if (filterId === 'overdue') return tasks.filter(t => getDueDateStatus(t.due_date)?.status === 'overdue').length;
    return 0;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="tasks-screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>My Tasks</Text>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        {FILTERS.map((f) => {
          const count = getFilterCount(f.id);
          const isOverdue = f.id === 'overdue' && count > 0;
          return (
            <TouchableOpacity
              key={f.id}
              testID={`filter-${f.id}`}
              style={[
                styles.filterChip, 
                filter === f.id && styles.filterChipActive,
                isOverdue && filter !== f.id && { backgroundColor: DUE_COLORS.overdue + '20' }
              ]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[
                styles.filterText, 
                filter === f.id && styles.filterTextActive,
                isOverdue && filter !== f.id && { color: DUE_COLORS.overdue }
              ]}>
                {f.label} {count > 0 ? `(${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTasks(); }} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{filter === 'overdue' ? '🎉' : '📝'}</Text>
            <Text style={[styles.emptyText, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>
              {filter === 'overdue' ? 'No overdue tasks! Great job!' : 
               filter === 'today' ? 'No tasks due today' :
               filter === 'tomorrow' ? 'No tasks due tomorrow' :
               'No tasks here. Tap + to create one!'}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => {
            const dueStatus = getDueDateStatus(task.due_date);
            return (
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
                    {/* Due Date Badge */}
                    {dueStatus && (
                      <View style={[styles.dueBadge, { backgroundColor: dueStatus.color + '20' }]}>
                        <Text style={[styles.dueBadgeText, { color: dueStatus.color }]}>
                          {dueStatus.label}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.priorityTag, { backgroundColor: (PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color || '#999') + '20' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color || '#999' }}>
                        {task.priority}
                      </Text>
                    </View>
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
            );
          })
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
  taskMeta: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' },
  priorityTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  dueBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  dueBadgeText: { fontSize: 11, fontWeight: '700' },
  metaText: { fontSize: 12 },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 16 },
});
