import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, PRIORITIES, CATEGORIES } from '../src/utils/constants';
import { detectPersona, PERSONAS } from '../src/utils/personas';
import DateTimePicker from '@react-native-community/datetimepicker';

// Due Date badge colors (user requested)
const DUE_COLORS = {
  today: '#FF6B6B',    // Coral
  tomorrow: '#FFB020', // Amber
  overdue: '#FF4757',  // Red
  thisWeek: '#6C3AFF', // Purple
  later: '#9CA3AF',    // Grey
};

// Date helpers
const getDateShortcut = (shortcut: string): Date => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (shortcut) {
    case 'today':
      return today;
    case 'tomorrow':
      return new Date(today.getTime() + 24 * 60 * 60 * 1000);
    case 'this_weekend': {
      const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
      return new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
    }
    case 'next_week':
      return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return today;
  }
};

const getReminderTime = (timeStr: string, baseDate: Date): Date => {
  const date = new Date(baseDate);
  const [hours, minutes] = timeStr.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly.getTime() === today.getTime()) return 'Today';
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
};

const formatTime = (date: Date | null): string => {
  if (!date) return '';
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

export default function AddTaskScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📝');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('general');
  const [estimatedTime, setEstimatedTime] = useState(30);
  const [tags, setTags] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<{ title: string; estimated_time: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [aiTimeout, setAiTimeout] = useState(false);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const suggestTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Due Date & Reminder State
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  // AI auto-suggest with 1s debounce
  useEffect(() => {
    if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
    if (aiTimer.current) clearTimeout(aiTimer.current);
    setAiSuggestion(null);
    setAiTimeout(false);

    if (title.trim().length < 3) {
      setAiLoading(false);
      return;
    }

    suggestTimeout.current = setTimeout(async () => {
      setAiLoading(true);
      setAiTimeout(false);

      // 4-second timeout
      aiTimer.current = setTimeout(() => {
        setAiLoading(false);
        setAiTimeout(true);
      }, 4000);

      try {
        const suggestion = await api.aiSuggest(title);
        if (aiTimer.current) clearTimeout(aiTimer.current);
        setAiSuggestion(suggestion);
        setAiLoading(false);
      } catch {
        if (aiTimer.current) clearTimeout(aiTimer.current);
        setAiLoading(false);
        setAiTimeout(true);
      }
    }, 1000);

    return () => {
      if (suggestTimeout.current) clearTimeout(suggestTimeout.current);
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
  }, [title]);

  const applySuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSuggestion.emoji) setEmoji(aiSuggestion.emoji);
    if (aiSuggestion.priority) setPriority(aiSuggestion.priority);
    if (aiSuggestion.estimated_time) setEstimatedTime(aiSuggestion.estimated_time);
    if (aiSuggestion.category) setCategory(aiSuggestion.category);
    if (aiSuggestion.tags) setTags(aiSuggestion.tags);
    // Apply AI-suggested due date and reminder
    if (aiSuggestion.suggested_due) {
      const suggestedDate = getDateShortcut(aiSuggestion.suggested_due);
      setDueDate(suggestedDate);
      // If reminder time is suggested, apply it
      if (aiSuggestion.suggested_reminder) {
        setReminderTime(getReminderTime(aiSuggestion.suggested_reminder, suggestedDate));
      }
    }
    setAiSuggestion(null);
  };

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
        tags,
        subtasks: subtasks.map(s => ({ title: s.title, estimated_time: s.estimated_time, completed: false })),
        due_date: dueDate ? dueDate.toISOString() : null,
        reminder_time: reminderTime ? reminderTime.toISOString() : null,
      });
      router.back();
    } catch (e) {
      console.log('Create task error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Date shortcut handler
  const handleDateShortcut = (shortcut: string) => {
    const date = getDateShortcut(shortcut);
    setDueDate(date);
  };

  // Time shortcut handler
  const handleTimeShortcut = (timeStr: string) => {
    if (!dueDate) return;
    setReminderTime(getReminderTime(timeStr, dueDate));
  };

  // Date picker handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setDueDate(selectedDate);
      }
    } else {
      setTempDate(selectedDate || tempDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && selectedTime) {
        const newReminder = new Date(dueDate || new Date());
        newReminder.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
        setReminderTime(newReminder);
      }
    } else {
      setTempTime(selectedTime || tempTime);
    }
  };

  const confirmDatePicker = () => {
    setDueDate(tempDate);
    setShowDatePicker(false);
  };

  const confirmTimePicker = () => {
    const newReminder = new Date(dueDate || new Date());
    newReminder.setHours(tempTime.getHours(), tempTime.getMinutes(), 0, 0);
    setReminderTime(newReminder);
    setShowTimePicker(false);
  };

  const clearDueDate = () => {
    setDueDate(null);
    setReminderTime(null);
  };

  const clearReminderTime = () => {
    setReminderTime(null);
  };

  const timeOptions = [15, 30, 45, 60, 90, 120];

  const themeColors = isDark ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]} testID="add-task-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity testID="close-add-task" onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={[styles.closeText, { color: themeColors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>New Task</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.titleRow}>
            <Text style={styles.emojiDisplay}>{emoji}</Text>
            <TextInput
              testID="task-title-input"
              style={[styles.titleInput, { color: themeColors.text }]}
              placeholder="What do you need to do?"
              placeholderTextColor={themeColors.textTertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              multiline
            />
          </View>

          {/* Persona Detection Preview */}
          {title.trim().length >= 3 && (() => {
            const personaId = detectPersona(title);
            const persona = PERSONAS[personaId];
            return (
              <View style={[styles.personaPreview, { backgroundColor: persona.color + '10', borderColor: persona.color + '30' }]} testID="persona-preview">
                <View style={[styles.personaIconSmall, { backgroundColor: persona.color + '20' }]}>
                  <Text style={styles.personaEmojiSmall}>{persona.emoji}</Text>
                </View>
                <View style={styles.personaPreviewText}>
                  <Text style={[styles.personaPreviewLabel, { color: themeColors.textSecondary }]}>
                    Your AI helper will be
                  </Text>
                  <Text style={[styles.personaPreviewName, { color: persona.color }]}>
                    {persona.name}
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* AI Suggestion Card */}
          {aiLoading && (
            <View style={[styles.aiSuggestCard, { backgroundColor: COLORS.primary + '08', borderColor: COLORS.primary + '30' }]}>
              <View style={styles.aiSuggestHeader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={[styles.aiSuggestTitle, { color: COLORS.primary }]}>AI is thinking...</Text>
              </View>
            </View>
          )}

          {aiTimeout && (
            <View style={[styles.aiSuggestCard, { backgroundColor: COLORS.warning + '10', borderColor: COLORS.warning + '30' }]}>
              <Text style={[styles.aiSuggestTitle, { color: COLORS.warning }]}>⏳ AI took too long. Try again or set manually.</Text>
            </View>
          )}

          {aiSuggestion && !aiLoading && (
            <View style={[styles.aiSuggestCard, { backgroundColor: themeColors.surface, borderColor: COLORS.primary + '40' }]} testID="ai-suggestion-card">
              <View style={styles.aiSuggestHeader}>
                <Text style={styles.aiSuggestTitle}>✨ AI Suggests</Text>
              </View>
              <View style={styles.aiSuggestRow}>
                <View style={styles.aiSuggestItem}>
                  <Text style={styles.aiSuggestLabel}>Emoji</Text>
                  <Text style={styles.aiSuggestValue}>{aiSuggestion.emoji || '📝'}</Text>
                </View>
                <View style={styles.aiSuggestItem}>
                  <Text style={styles.aiSuggestLabel}>Priority</Text>
                  <Text style={[styles.aiSuggestValue, { color: PRIORITIES[aiSuggestion.priority as keyof typeof PRIORITIES]?.color }]}>
                    {PRIORITIES[aiSuggestion.priority as keyof typeof PRIORITIES]?.emoji} {aiSuggestion.priority}
                  </Text>
                </View>
                <View style={styles.aiSuggestItem}>
                  <Text style={styles.aiSuggestLabel}>Time</Text>
                  <Text style={styles.aiSuggestValue}>{aiSuggestion.estimated_time}m</Text>
                </View>
                {aiSuggestion.suggested_due && (
                  <View style={styles.aiSuggestItem}>
                    <Text style={styles.aiSuggestLabel}>Due</Text>
                    <Text style={[styles.aiSuggestValue, { color: DUE_COLORS.today }]}>
                      {aiSuggestion.suggested_due === 'today' ? '📅 Today' : 
                       aiSuggestion.suggested_due === 'tomorrow' ? '📅 Tomorrow' :
                       aiSuggestion.suggested_due === 'this_weekend' ? '📅 Weekend' : '📅 Next Week'}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity testID="apply-suggestion-btn" style={styles.applySuggestionBtn} onPress={applySuggestion} activeOpacity={0.7}>
                <Text style={styles.applySuggestionText}>Apply All ✨</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Due Date Section */}
          <TouchableOpacity 
            style={[styles.dateSection, { backgroundColor: themeColors.surface, borderLeftColor: COLORS.primary }]} 
            testID="due-date-section"
            onPress={() => {
              if (!dueDate) {
                setTempDate(new Date());
                setShowDatePicker(true);
              }
            }}
            activeOpacity={dueDate ? 1 : 0.7}
          >
            <View style={styles.dateSectionHeader}>
              <Text style={[styles.dateSectionIcon]}>📅</Text>
              <Text style={[styles.dateSectionTitle, { color: themeColors.text }]}>Due Date</Text>
              {dueDate && (
                <TouchableOpacity onPress={clearDueDate} style={styles.clearBtn} testID="clear-due-date">
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Date Display / Picker Trigger */}
            {dueDate ? (
              <TouchableOpacity 
                style={[styles.dateDisplay, { backgroundColor: DUE_COLORS.today + '15', borderColor: DUE_COLORS.today + '40' }]}
                onPress={() => {
                  setTempDate(dueDate);
                  setShowDatePicker(true);
                }}
                testID="selected-due-date"
              >
                <Text style={[styles.dateDisplayText, { color: DUE_COLORS.today }]}>{formatDate(dueDate)}</Text>
                <Text style={[styles.dateDisplaySub, { color: themeColors.textSecondary }]}>Tap to change</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.dateShortcuts}>
                <TouchableOpacity 
                  style={[styles.dateShortcutBtn, { backgroundColor: DUE_COLORS.today + '15' }]} 
                  onPress={() => handleDateShortcut('today')}
                  testID="shortcut-today"
                >
                  <Text style={[styles.dateShortcutText, { color: DUE_COLORS.today }]}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dateShortcutBtn, { backgroundColor: DUE_COLORS.tomorrow + '15' }]} 
                  onPress={() => handleDateShortcut('tomorrow')}
                  testID="shortcut-tomorrow"
                >
                  <Text style={[styles.dateShortcutText, { color: DUE_COLORS.tomorrow }]}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dateShortcutBtn, { backgroundColor: COLORS.primary + '15' }]} 
                  onPress={() => handleDateShortcut('this_weekend')}
                  testID="shortcut-weekend"
                >
                  <Text style={[styles.dateShortcutText, { color: COLORS.primary }]}>Weekend</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dateShortcutBtn, { backgroundColor: themeColors.textSecondary + '15' }]} 
                  onPress={() => handleDateShortcut('next_week')}
                  testID="shortcut-next-week"
                >
                  <Text style={[styles.dateShortcutText, { color: themeColors.textSecondary }]}>Next Week</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Custom Date Picker Button */}
            {!dueDate && (
              <TouchableOpacity 
                style={[styles.customDateBtn, { borderColor: themeColors.border }]}
                onPress={() => {
                  setTempDate(new Date());
                  setShowDatePicker(true);
                }}
                testID="pick-custom-date"
              >
                <Text style={[styles.customDateText, { color: themeColors.textSecondary }]}>📆 Pick a date...</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reminder Time Section - Only visible when due date is set */}
          {dueDate && (
            <View style={[styles.dateSection, { backgroundColor: themeColors.surface, borderLeftColor: COLORS.primary }]} testID="reminder-section">
              <View style={styles.dateSectionHeader}>
                <Text style={[styles.dateSectionIcon]}>⏰</Text>
                <Text style={[styles.dateSectionTitle, { color: themeColors.text }]}>Reminder</Text>
                {reminderTime && (
                  <TouchableOpacity onPress={clearReminderTime} style={styles.clearBtn} testID="clear-reminder">
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Reminder Display / Picker Trigger */}
              {reminderTime ? (
                <TouchableOpacity 
                  style={[styles.dateDisplay, { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary + '40' }]}
                  onPress={() => {
                    setTempTime(reminderTime);
                    setShowTimePicker(true);
                  }}
                  testID="selected-reminder-time"
                >
                  <Text style={[styles.dateDisplayText, { color: COLORS.primary }]}>{formatTime(reminderTime)}</Text>
                  <Text style={[styles.dateDisplaySub, { color: themeColors.textSecondary }]}>Tap to change</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.dateShortcuts}>
                  <TouchableOpacity 
                    style={[styles.timeShortcutBtn, { backgroundColor: COLORS.warning + '15' }]} 
                    onPress={() => handleTimeShortcut('9:00')}
                    testID="shortcut-9am"
                  >
                    <Text style={styles.timeShortcutEmoji}>🌅</Text>
                    <Text style={[styles.timeShortcutText, { color: COLORS.warning }]}>9:00 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.timeShortcutBtn, { backgroundColor: COLORS.primary + '15' }]} 
                    onPress={() => handleTimeShortcut('14:00')}
                    testID="shortcut-2pm"
                  >
                    <Text style={styles.timeShortcutEmoji}>☀️</Text>
                    <Text style={[styles.timeShortcutText, { color: COLORS.primary }]}>2:00 PM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.timeShortcutBtn, { backgroundColor: COLORS.primaryDark + '15' }]} 
                    onPress={() => handleTimeShortcut('18:00')}
                    testID="shortcut-6pm"
                  >
                    <Text style={styles.timeShortcutEmoji}>🌆</Text>
                    <Text style={[styles.timeShortcutText, { color: COLORS.primaryDark }]}>6:00 PM</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Custom Time Picker Button */}
              {!reminderTime && (
                <TouchableOpacity 
                  style={[styles.customDateBtn, { borderColor: themeColors.border }]}
                  onPress={() => {
                    const defaultTime = new Date(dueDate);
                    defaultTime.setHours(9, 0, 0, 0);
                    setTempTime(defaultTime);
                    setShowTimePicker(true);
                  }}
                  testID="pick-custom-time"
                >
                  <Text style={[styles.customDateText, { color: themeColors.textSecondary }]}>🕐 Pick a time...</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Description */}
          <TextInput
            testID="task-desc-input"
            style={[styles.descInput, { color: themeColors.text, backgroundColor: themeColors.surface }]}
            placeholder="Add a description..."
            placeholderTextColor={themeColors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Priority */}
          <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Priority</Text>
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
          <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Category</Text>
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
          <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Estimated Time</Text>
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
            style={[styles.aiBtn, { backgroundColor: themeColors.surface }]}
            onPress={handleAIBreakdown}
            disabled={breakdownLoading || !title.trim()}
            activeOpacity={0.7}
          >
            {breakdownLoading ? (
              <>
                <Text style={styles.aiBtnEmoji}>🤖</Text>
                <Text style={[styles.aiBtnText, { color: COLORS.primary }]}>AI is thinking...</Text>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </>
            ) : (
              <>
                <Text style={styles.aiBtnEmoji}>✨</Text>
                <Text style={[styles.aiBtnText, { color: COLORS.primary }]}>Break into subtasks</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <View style={styles.subtasksSection}>
              <Text style={[styles.sectionLabel, { color: themeColors.text }]}>
                Subtasks ({subtasks.length})
              </Text>
              {subtasks.map((st, i) => (
                <View key={i} style={[styles.subtaskItem, { backgroundColor: themeColors.surface }]}>
                  <View style={styles.subtaskCircle} />
                  <Text style={[styles.subtaskTitle, { color: themeColors.text }]}>{st.title}</Text>
                  <Text style={[styles.subtaskTime, { color: themeColors.textTertiary }]}>
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
        <View style={[styles.footer, { backgroundColor: themeColors.background }]}>
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

      {/* Date Picker Modal (iOS) / Direct picker (Android) */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={[styles.pickerContainer, { backgroundColor: themeColors.surface }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={[styles.pickerCancel, { color: themeColors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.pickerTitle, { color: themeColors.text }]}>Select Date</Text>
                <TouchableOpacity onPress={confirmDatePicker}>
                  <Text style={[styles.pickerDone, { color: COLORS.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                minimumDate={new Date()}
                textColor={isDark ? '#FFFFFF' : '#000000'}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )
      )}

      {/* Time Picker Modal (iOS) / Direct picker (Android) */}
      {Platform.OS === 'ios' ? (
        <Modal visible={showTimePicker} transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={[styles.pickerContainer, { backgroundColor: themeColors.surface }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={[styles.pickerCancel, { color: themeColors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.pickerTitle, { color: themeColors.text }]}>Select Time</Text>
                <TouchableOpacity onPress={confirmTimePicker}>
                  <Text style={[styles.pickerDone, { color: COLORS.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                display="spinner"
                onChange={onTimeChange}
                textColor={isDark ? '#FFFFFF' : '#000000'}
              />
            </View>
          </View>
        </Modal>
      ) : (
        showTimePicker && (
          <DateTimePicker
            value={tempTime}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )
      )}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.sm },
  emojiDisplay: { fontSize: 36 },
  titleInput: { flex: 1, fontSize: 22, fontWeight: '700', paddingVertical: 8 },
  
  // AI Suggestion Card styles
  aiSuggestCard: { borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1.5 },
  aiSuggestHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aiSuggestTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  aiSuggestRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  aiSuggestItem: { alignItems: 'center', minWidth: 60 },
  aiSuggestLabel: { fontSize: 10, color: '#999', fontWeight: '600', textTransform: 'uppercase' },
  aiSuggestValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  applySuggestionBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center', marginTop: SPACING.sm },
  applySuggestionText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  
  // Date Section styles
  dateSection: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    ...SHADOWS.sm,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 8,
  },
  dateSectionIcon: { fontSize: 20 },
  dateSectionTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,71,87,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: { fontSize: 12, color: '#FF4757', fontWeight: '700' },
  
  dateShortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateShortcutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  dateShortcutText: { fontSize: 14, fontWeight: '700' },
  
  timeShortcutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeShortcutEmoji: { fontSize: 16 },
  timeShortcutText: { fontSize: 14, fontWeight: '700' },
  
  customDateBtn: {
    marginTop: SPACING.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  customDateText: { fontSize: 14, fontWeight: '600' },
  
  dateDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  dateDisplayText: { fontSize: 18, fontWeight: '800' },
  dateDisplaySub: { fontSize: 12, marginTop: 2 },
  
  // Picker Modal styles
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerContainer: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom: 34,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  pickerTitle: { fontSize: 17, fontWeight: '700' },
  pickerCancel: { fontSize: 16, fontWeight: '600' },
  pickerDone: { fontSize: 16, fontWeight: '700' },
  
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
  // Persona Preview
  personaPreview: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.sm, borderWidth: 1, gap: 10 },
  personaIconSmall: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  personaEmojiSmall: { fontSize: 18 },
  personaPreviewText: { flex: 1 },
  personaPreviewLabel: { fontSize: 11, fontWeight: '600' },
  personaPreviewName: { fontSize: 14, fontWeight: '800' },
  footer: { padding: SPACING.md, paddingBottom: SPACING.lg },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md + 2, alignItems: 'center', ...SHADOWS.md },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});
