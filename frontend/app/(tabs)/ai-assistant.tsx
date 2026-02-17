import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, AI_MODELS, MASCOTS } from '../../src/utils/constants';

export default function AIAssistantScreen() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: string; content: string; model?: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiModel, setAiModel] = useState('claude');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msgText }]);
    setLoading(true);

    const timeout = setTimeout(() => {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm taking a bit longer than expected. Please try again! 🤖", model: aiModel }]);
    }, 15000);

    try {
      const resp = await api.aiChat(msgText, aiModel, sessionId || undefined);
      clearTimeout(timeout);
      setSessionId(resp.session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: resp.response, model: resp.ai_model }]);
    } catch (e: any) {
      clearTimeout(timeout);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Something went wrong. Please try again. 🤖', model: aiModel }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const modelInfo = AI_MODELS[aiModel as keyof typeof AI_MODELS];
  const mascotEmoji = MASCOTS[user?.mascot as keyof typeof MASCOTS]?.emoji || '🦉';
  const mascotName = MASCOTS[user?.mascot as keyof typeof MASCOTS]?.name || 'Wise Owl';

  const SUGGESTIONS = [
    '🔨 Help me break down a task',
    '📅 Plan my week',
    '🤔 I don\'t know how to start this task',
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="ai-assistant-screen">
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex} keyboardVerticalOffset={90}>
        {/* Chat Messages Area */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome State - always visible when no messages */}
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
                    onPress={() => sendMessage(s.replace(/^[^\s]+\s/, ''))}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.suggestionText, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{s}</Text>
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
                msg.role === 'user' ? styles.msgBubbleUser : [styles.msgBubbleAI, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface }]
              ]}>
                <Text style={[styles.msgText, msg.role === 'user' ? styles.msgTextUser : { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>
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
                  <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                  <View style={[styles.dot, styles.dotDelay1, { backgroundColor: COLORS.primary }]} />
                  <View style={[styles.dot, styles.dotDelay2, { backgroundColor: COLORS.primary }]} />
                </View>
              </View>
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Input Bar - ALWAYS visible */}
        <View style={[styles.inputBar, { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface, borderTopColor: isDark ? COLORS.dark.border : COLORS.light.border }]}>
          <TextInput
            testID="ai-chat-input"
            style={[styles.input, { color: isDark ? COLORS.dark.text : COLORS.light.text, backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]}
            placeholder="Ask me anything..."
            placeholderTextColor={isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            testID="ai-send-btn"
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  title: { fontSize: 24, fontWeight: '900' },
  modelBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, gap: 4 },
  modelIcon: { fontSize: 16 },
  modelName: { fontSize: 13, fontWeight: '800' },
  modelArrow: { fontSize: 8, marginLeft: 2 },
  modelPicker: { position: 'absolute', top: 100, right: SPACING.md, zIndex: 100, borderRadius: RADIUS.lg, padding: SPACING.sm, width: 260 },
  modelOption: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, gap: 10 },
  modelOptionIcon: { fontSize: 24 },
  modelOptionInfo: { flex: 1 },
  modelOptionName: { fontSize: 15, fontWeight: '700' },
  modelOptionDesc: { fontSize: 12 },
  modelCheck: { fontSize: 18, fontWeight: '800' },
  chatArea: { flex: 1 },
  chatContent: { padding: SPACING.md, flexGrow: 1 },
  welcomeContainer: { alignItems: 'center', paddingTop: 30, flex: 1 },
  welcomeEmoji: { fontSize: 56 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', marginTop: SPACING.md, textAlign: 'center' },
  welcomeDesc: { fontSize: 14, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 22, paddingHorizontal: SPACING.md },
  suggestions: { marginTop: SPACING.lg, gap: 10, width: '100%' },
  suggestionChip: { padding: SPACING.md, borderRadius: RADIUS.lg },
  suggestionText: { fontSize: 15, fontWeight: '600' },
  msgRow: { flexDirection: 'row', marginBottom: SPACING.sm, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  avatarBubble: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 6, marginBottom: 4 },
  msgAvatar: { fontSize: 16 },
  msgBubble: { maxWidth: '78%', borderRadius: RADIUS.lg, padding: SPACING.md },
  msgBubbleUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  msgBubbleAI: { borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  msgTextUser: { color: '#FFF' },
  typingDots: { flexDirection: 'row', gap: 4, paddingVertical: 4, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, opacity: 0.4 },
  dotDelay1: { opacity: 0.6 },
  dotDelay2: { opacity: 0.8 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.sm, gap: 8, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: RADIUS.lg, paddingHorizontal: SPACING.md, paddingVertical: 10, fontSize: 16, maxHeight: 120, minHeight: 44 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { color: '#FFF', fontSize: 22, fontWeight: '700' },
});
