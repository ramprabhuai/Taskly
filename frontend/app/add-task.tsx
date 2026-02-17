import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, PRIORITIES, CATEGORIES } from '../src/utils/constants';

export default function AddTaskScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [subtasks, setSubtasks] = useState<{ title: string; estimated_time: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const suggestTimeout = useRef<NodeJS.Timeout | null>(null);

  // AI auto-suggest when title changes (with 1s debounce)
  useEffect(() => {
    if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
    if (title.trim().length < 3) return;
    suggestTimeout.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const suggestion = await api.aiSuggest(title);
        if (suggestion.emoji) setEmoji(suggestion.emoji);
        if (suggestion.priority) setPriority(suggestion.priority);
        if (suggestion.estimated_time) setEstimatedTime(suggestion.estimated_time);
        if (suggestion.category) setCategory(suggestion.category);
      } catch {}
      setAiLoading(false);
    }, 1000);
    return () => { if (suggestTimeout.current) clearTimeout(suggestTimeout.current); };
  }, [title]);

  const handleAIBreakdown = async () => {
    if (!title.trim()) return;
    setBreakdownLoading(true);
    try {
      const result = await api.aiBreakdown(title);
      if (result.subtasks) setSubtasks(result.subtasks);
    } catch {}
    setBreakdownLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await api.createTask({
        title,
        description,
        emoji,
        priority,
        category,
        estimated_time: estimatedTime,
        subtasks: subtasks.map(s => ({ title: s.title, estimated_time: s.estimated_time, completed: false })),
      });
      router.back();
    } catch (e) {
      console.log('Create task error:', e);
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = [15, 30, 45, 60, 90, 120];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="add-task-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity testID="close-add-task" onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={[styles.closeText, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>New Task</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.titleRow}>
            <Text style={styles.emojiDisplay}>{emoji}</Text>
            <TextInput
              testID="task-title-input"
              style={[styles.titleInput, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}
              placeholder="What do you need to do?"
              placeholderTextColor={isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              multiline
            />
            {aiLoading && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>

          {/* Description */}
          <TextInput
            testID="task-desc-input"
            style={[styles.descInput, { color: isDark ? COLORS.dark.text : COLORS.light.text, backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }]}
            placeholder="Add a description..."
            placeholderTextColor={isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Priority */}
          <Text style={[styles.sectionLabel, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Priority</Text>
          <View style={styles.priorityRow}>
            {Object.entries(PRIORITIES).map(([key, p]) => (
              <TouchableOpacity
                key={key}
                testID={`priority-${key}`}
                style={[styles.priorityChip, priority === key && { backgroundColor: p.color + '20', borderColor: p.color }]}
                onPress={() => setPriority(key)}
              >
                <Text style={styles.priorityEmoji}>{p.emoji}</Text>
                <Text style={[styles.priorityLabel, priority === key && { color: p.color }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category */}
          <Text style={[styles.sectionLabel, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                testID={`category-${c.id}`}
                style={[styles.catChip, category === c.id && styles.catChipActive]}
                onPress={() => setCategory(c.id)}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={[styles.catLabel, category === c.id && styles.catLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Estimated Time */}
          <Text style={[styles.sectionLabel, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Estimated Time</Text>
          <View style={styles.timeRow}>
            {timeOptions.map((t) => (
              <TouchableOpacity
                key={t}
                testID={`time-${t}`}
                style={[styles.timeChip, estimatedTime === t && styles.timeChipActive]}
                onPress={() => setEstimatedTime(t)}
              >
                <Text style={[styles.timeText, estimatedTime === t && styles.timeTextActive]}>
                  {t >= 60 ? `${t / 60}h` : `${t}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Breakdown Button */}
          <TouchableOpacity
            testID="ai-breakdown-btn"
            style={[styles.aiBtn, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }]}
            onPress={handleAIBreakdown}
            disabled={breakdownLoading || !title.trim()}
            activeOpacity={0.7}
          >
            {breakdownLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Text style={styles.aiBtnEmoji}>🤖</Text>
                <Text style={[styles.aiBtnText, { color: COLORS.primary }]}>Let AI break this down</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <View style={styles.subtasksSection}>
              <Text style={[styles.sectionLabel, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Subtasks</Text>
              {subtasks.map((st, i) => (
                <View key={i} style={[styles.subtaskItem, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }]}>
                  <View style={styles.subtaskCircle} />
                  <Text style={[styles.subtaskTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{st.title}</Text>
                  <Text style={[styles.subtaskTime, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>
                    {st.estimated_time}m
                  </Text>
                  <TouchableOpacity onPress={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))}>
                    <Text style={styles.subtaskDelete}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]}>
          <TouchableOpacity
            testID="save-task-btn"
            style={[styles.saveBtn, (!title.trim() || loading) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!title.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Create Task ✨</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  scroll: { padding: SPACING.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.md },
  emojiDisplay: { fontSize: 36 },
  titleInput: { flex: 1, fontSize: 22, fontWeight: '700', paddingVertical: 8 },
  descInput: { borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: 15, minHeight: 60, marginBottom: SPACING.md, textAlignVertical: 'top' },
  sectionLabel: { fontSize: 15, fontWeight: '800', marginBottom: SPACING.sm, marginTop: SPACING.sm },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.sm },
  priorityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)', gap: 6 },
  priorityEmoji: { fontSize: 14 },
  priorityLabel: { fontSize: 14, fontWeight: '700', color: '#666' },
  catScroll: { marginBottom: SPACING.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: 'rgba(108,58,255,0.08)', gap: 6 },
  catChipActive: { backgroundColor: COLORS.primary },
  catEmoji: { fontSize: 16 },
  catLabel: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  catLabelActive: { color: '#FFF' },
  timeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: SPACING.sm },
  timeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(108,58,255,0.08)' },
  timeChipActive: { backgroundColor: COLORS.primary },
  timeText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  timeTextActive: { color: '#FFF' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: SPACING.md, borderRadius: RADIUS.lg, marginTop: SPACING.sm, borderWidth: 1.5, borderColor: COLORS.primary + '30', gap: 8 },
  aiBtnEmoji: { fontSize: 20 },
  aiBtnText: { fontSize: 15, fontWeight: '700' },
  subtasksSection: { marginTop: SPACING.md },
  subtaskItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, marginBottom: 6, gap: 8 },
  subtaskCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.primary + '50' },
  subtaskTitle: { flex: 1, fontSize: 14, fontWeight: '600' },
  subtaskTime: { fontSize: 12 },
  subtaskDelete: { fontSize: 16, color: COLORS.accent, paddingHorizontal: 4 },
  footer: { padding: SPACING.md, paddingBottom: SPACING.lg },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md + 2, alignItems: 'center', ...SHADOWS.md },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
