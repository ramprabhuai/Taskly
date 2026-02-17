import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, AI_MODELS, MASCOTS } from '../../src/utils/constants';

export default function AIAssistantScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<{ role: string; content: string; model?: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiModel, setAiModel] = useState('claude');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showMicTooltip, setShowMicTooltip] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  // Animate typing dots
  useEffect(() => {
    if (!loading) return;
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.stagger(150, [
            Animated.sequence([
              Animated.timing(dotAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.timing(dotAnim1, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(dotAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.timing(dotAnim2, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]),
            Animated.sequence([
              Animated.timing(dotAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
              Animated.timing(dotAnim3, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]),
          ]),
        ])
      ).start();
    };
    animate();
  }, [loading]);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msgText }]);
    setLoading(true);
    console.log('Sending to model:', aiModel);

    const timeout = setTimeout(() => {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "AI is taking too long. Try again? 🤖", model: aiModel }]);
    }, 10000);

    try {
      const resp = await api.aiChat(msgText, aiModel, sessionId || undefined);
      clearTimeout(timeout);
      console.log('Response from model:', resp.ai_model, '- length:', resp.response?.length);
      setSessionId(resp.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: resp.response, model: resp.ai_model }]);
    } catch (e: any) {
      clearTimeout(timeout);
      const errorMsg = e?.message?.includes('fetch') || e?.message?.includes('network')
        ? "You seem to be offline. Check your connection and try again! 📡"
        : "Oops! Something went wrong. Please try again. 🤖";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, model: aiModel }]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages, loading]);

  const modelInfo = AI_MODELS[aiModel as keyof typeof AI_MODELS];
  const mascotEmoji = MASCOTS[user?.mascot as keyof typeof MASCOTS]?.emoji || '🦉';

  const SUGGESTIONS = [
    { icon: '🔨', text: 'Help me break down a task' },
    { icon: '📅', text: 'Plan my week' },
    { icon: '🤔', text: "I don't know how to start this task" },
  ];

  // Tab bar height for bottom padding
  const TAB_BAR_HEIGHT = 60 + insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="ai-assistant-screen">
      <SafeAreaView style={styles.flex} edges={['top']}>
        {/* Header with model selector */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>AI Assistant</Text>
          <TouchableOpacity
            testID="ai-model-selector"
            style={[styles.modelBadge, { backgroundColor: modelInfo.color + '20', borderColor: modelInfo.color }]}
            onPress={() => setShowModelPicker(!showModelPicker)}
          >
            <Text style={styles.modelIcon}>{modelInfo.icon}</Text>
            <Text style={[styles.modelName, { color: modelInfo.color }]}>{modelInfo.name}</Text>
            <Text style={[styles.modelArrow, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Model Picker Dropdown */}
        {showModelPicker && (
          <View style={[styles.modelPicker, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }, SHADOWS.lg]}>
            {Object.entries(AI_MODELS).map(([key, m]) => (
              <TouchableOpacity
                key={key}
                testID={`ai-model-${key}`}
                style={[styles.modelOption, aiModel === key && { backgroundColor: m.color + '15' }]}
                onPress={() => { setAiModel(key); setShowModelPicker(false); }}
              >
                <Text style={styles.modelOptionIcon}>{m.icon}</Text>
                <View style={styles.modelOptionInfo}>
                  <Text style={[styles.modelOptionName, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{m.name}</Text>
                  <Text style={[styles.modelOptionDesc, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>{m.description}</Text>
                </View>
                {aiModel === key && <Text style={[styles.modelCheck, { color: m.color }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {/* Chat Messages Area */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatArea}
            contentContainerStyle={[styles.chatContent, { paddingBottom: 16 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Welcome State */}
            {messages.length === 0 && (
              <View style={styles.welcomeContainer} testID="ai-welcome">
                <Text style={styles.welcomeEmoji}>{mascotEmoji}</Text>
                <Text style={[styles.welcomeTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>
                  Hi {user?.name || 'there'}! I'm your Taskly AI
                </Text>
                <Text style={[styles.welcomeDesc, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>
                  Powered by {modelInfo.name} {modelInfo.icon}{'\n'}I can help you plan tasks, break them down, or answer any question!
                </Text>
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      testID={`suggestion-${i}`}
                      style={[styles.suggestionChip, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }, SHADOWS.sm]}
                      onPress={() => setInput(s.text)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.suggestionText, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>
                        {s.icon} {s.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <View key={i} style={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : styles.msgRowAI]}>
                {msg.role === 'assistant' && (
                  <View style={[styles.avatarBubble, { backgroundColor: (AI_MODELS[msg.model as keyof typeof AI_MODELS]?.color || COLORS.primary) + '20' }]}>
                    <Text style={styles.msgAvatar}>{AI_MODELS[msg.model as keyof typeof AI_MODELS]?.icon || '🤖'}</Text>
                  </View>
                )}
                <View style={[
                  styles.msgBubble,
                  msg.role === 'user'
                    ? styles.msgBubbleUser
                    : [styles.msgBubbleAI, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }]
                ]}>
                  <Text style={[
                    styles.msgText,
                    msg.role === 'user' ? styles.msgTextUser : { color: isDark ? COLORS.dark.text : COLORS.light.text }
                  ]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}

            {/* Typing indicator */}
            {loading && (
              <View style={[styles.msgRow, styles.msgRowAI]}>
                <View style={[styles.avatarBubble, { backgroundColor: modelInfo.color + '20' }]}>
                  <Text style={styles.msgAvatar}>{modelInfo.icon}</Text>
                </View>
                <View style={[styles.msgBubble, styles.msgBubbleAI, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }]}>
                  <View style={styles.typingDots}>
                    <Animated.View style={[styles.dot, { backgroundColor: modelInfo.color, transform: [{ scale: Animated.add(0.6, Animated.multiply(dotAnim1, 0.4)) }], opacity: Animated.add(0.4, Animated.multiply(dotAnim1, 0.6)) }]} />
                    <Animated.View style={[styles.dot, { backgroundColor: modelInfo.color, transform: [{ scale: Animated.add(0.6, Animated.multiply(dotAnim2, 0.4)) }], opacity: Animated.add(0.4, Animated.multiply(dotAnim2, 0.6)) }]} />
                    <Animated.View style={[styles.dot, { backgroundColor: modelInfo.color, transform: [{ scale: Animated.add(0.6, Animated.multiply(dotAnim3, 0.4)) }], opacity: Animated.add(0.4, Animated.multiply(dotAnim3, 0.6)) }]} />
                  </View>
                  <Text style={[styles.typingLabel, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>
                    {modelInfo.name} is thinking...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* ========== CHAT INPUT BAR - ALWAYS VISIBLE ========== */}
          <View style={[
            styles.inputBarOuter,
            {
              backgroundColor: isDark ? COLORS.dark.surface : '#FFFFFF',
              paddingBottom: TAB_BAR_HEIGHT + 4,
              borderTopColor: isDark ? COLORS.dark.border : '#F0F0F0',
            }
          ]}>
            <View style={[styles.inputBarInner, { backgroundColor: isDark ? COLORS.dark.background : '#F5F3FF' }]}>
              {/* Mic button */}
              <TouchableOpacity
                testID="mic-btn"
                style={styles.micBtn}
                onPress={() => {
                  setShowMicTooltip(true);
                  setTimeout(() => setShowMicTooltip(false), 2000);
                }}
                activeOpacity={0.6}
              >
                <Text style={styles.micIcon}>🎤</Text>
              </TouchableOpacity>

              {/* Text Input */}
              <TextInput
                ref={inputRef}
                testID="ai-chat-input"
                style={[styles.textInput, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}
                placeholder="Ask me anything..."
                placeholderTextColor={isDark ? COLORS.dark.textTertiary : '#9CA3AF'}
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={2000}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
                blurOnSubmit={false}
              />

              {/* Send button */}
              <TouchableOpacity
                testID="ai-send-btn"
                style={[
                  styles.sendBtn,
                  (!input.trim() || loading) ? styles.sendBtnDisabled : styles.sendBtnActive,
                ]}
                onPress={() => sendMessage()}
                disabled={!input.trim() || loading}
                activeOpacity={0.7}
              >
                <Text style={styles.sendArrow}>↑</Text>
              </TouchableOpacity>
            </View>

            {/* Mic tooltip */}
            {showMicTooltip && (
              <View style={styles.micTooltip}>
                <Text style={styles.micTooltipText}>🎤 Voice input coming soon!</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: { fontSize: 24, fontWeight: '900' },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 4,
  },
  modelIcon: { fontSize: 16 },
  modelName: { fontSize: 13, fontWeight: '800' },
  modelArrow: { fontSize: 8, marginLeft: 2 },
  modelPicker: {
    position: 'absolute',
    top: 100,
    right: SPACING.md,
    zIndex: 100,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    width: 260,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 10,
  },
  modelOptionIcon: { fontSize: 24 },
  modelOptionInfo: { flex: 1 },
  modelOptionName: { fontSize: 15, fontWeight: '700' },
  modelOptionDesc: { fontSize: 12 },
  modelCheck: { fontSize: 18, fontWeight: '800' },

  // Chat area
  chatArea: { flex: 1 },
  chatContent: { padding: SPACING.md, flexGrow: 1 },

  // Welcome
  welcomeContainer: { alignItems: 'center', paddingTop: 20 },
  welcomeEmoji: { fontSize: 56 },
  welcomeTitle: { fontSize: 20, fontWeight: '800', marginTop: SPACING.sm, textAlign: 'center' },
  welcomeDesc: { fontSize: 14, textAlign: 'center', marginTop: SPACING.xs, lineHeight: 20, paddingHorizontal: SPACING.md },
  suggestions: { marginTop: SPACING.lg, gap: 10, width: '100%' },
  suggestionChip: { padding: SPACING.md, borderRadius: RADIUS.lg },
  suggestionText: { fontSize: 15, fontWeight: '600' },

  // Messages
  msgRow: { flexDirection: 'row', marginBottom: SPACING.sm, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  avatarBubble: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 6, marginBottom: 4 },
  msgAvatar: { fontSize: 16 },
  msgBubble: { maxWidth: '78%', borderRadius: 20, padding: 14 },
  msgBubbleUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  msgBubbleAI: { borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  msgTextUser: { color: '#FFF' },

  // Typing dots
  typingDots: { flexDirection: 'row', gap: 6, paddingVertical: 2, paddingHorizontal: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  typingLabel: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },

  // ========== INPUT BAR ==========
  inputBarOuter: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputBarInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 50,
    gap: 4,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  micIcon: { fontSize: 18 },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 36,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    paddingHorizontal: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
  sendBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendArrow: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginTop: -1,
  },
  micTooltip: {
    position: 'absolute',
    left: 12,
    bottom: '100%',
    marginBottom: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  micTooltipText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
});
