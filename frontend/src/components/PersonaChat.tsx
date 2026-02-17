import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { api } from '../utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/constants';
import { PERSONAS, Persona } from '../utils/personas';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface PersonaChatProps {
  visible: boolean;
  persona: Persona;
  taskTitle: string;
  taskId: string;
  onClose: () => void;
  onSubtaskAdded?: () => void;
}

export function PersonaChat({ visible, persona, taskTitle, taskId, onClose, onSubtaskAdded }: PersonaChatProps) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`persona_${taskId}_${Date.now()}`);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && messages.length === 0) {
      // Add welcome message from persona
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your ${persona.name} ${persona.emoji}. I'm here to help you with "${taskTitle}". What would you like to know?`,
      }]);
    }
  }, [visible]);

  const sendMessage = async (text?: string) => {
    const msgText = text || input.trim();
    if (!msgText || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msgText }]);
    setLoading(true);

    try {
      const resp = await api.personaChat(msgText, taskId, persona.id, sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: resp.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: `I'm having trouble right now. Try again? ${persona.emoji}` }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent testID="persona-chat-modal">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayBg} onPress={onClose} activeOpacity={1} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.sheet, { borderTopColor: persona.color }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: persona.color + '20' }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.personaAvatar, { backgroundColor: persona.color + '20' }]}>
                <Text style={styles.personaEmoji}>{persona.emoji}</Text>
              </View>
              <View>
                <Text style={styles.personaName}>{persona.name}</Text>
                <Text style={styles.taskContext} numberOfLines={1}>About: {taskTitle}</Text>
              </View>
            </View>
            <TouchableOpacity testID="close-persona-chat" onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg, i) => (
              <View key={i} style={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : styles.msgRowAI]}>
                {msg.role === 'assistant' && (
                  <View style={[styles.msgAvatarSmall, { backgroundColor: persona.color + '20' }]}>
                    <Text style={styles.msgAvatarText}>{persona.emoji}</Text>
                  </View>
                )}
                <View style={[
                  styles.msgBubble,
                  msg.role === 'user'
                    ? { backgroundColor: persona.color }
                    : { backgroundColor: '#F3F4F6' }
                ]}>
                  <Text style={[styles.msgText, msg.role === 'user' && { color: '#FFF' }]}>
                    {msg.content}
                  </Text>
                </View>
              </View>
            ))}
            {loading && (
              <View style={[styles.msgRow, styles.msgRowAI]}>
                <View style={[styles.msgAvatarSmall, { backgroundColor: persona.color + '20' }]}>
                  <Text style={styles.msgAvatarText}>{persona.emoji}</Text>
                </View>
                <View style={[styles.msgBubble, { backgroundColor: '#F3F4F6' }]}>
                  <ActivityIndicator size="small" color={persona.color} />
                  <Text style={styles.thinkingText}>{persona.name} is thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Actions */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions} contentContainerStyle={styles.quickActionsContent}>
            {[
              `How should I approach this?`,
              `Break this into steps`,
              `Give me tips for "${taskTitle}"`,
            ].map((q, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.quickChip, { borderColor: persona.color + '40' }]}
                onPress={() => sendMessage(q)}
              >
                <Text style={[styles.quickText, { color: persona.color }]} numberOfLines={1}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputBar}>
            <TextInput
              testID="persona-chat-input"
              style={styles.input}
              placeholder={`Ask your ${persona.name}...`}
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
            />
            <TouchableOpacity
              testID="persona-send-btn"
              style={[styles.sendBtn, { backgroundColor: (!input.trim() || loading) ? '#D1D5DB' : persona.color }]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <Text style={styles.sendArrow}>↑</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  overlayBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
    minHeight: SCREEN_HEIGHT * 0.5,
    borderTopWidth: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  personaAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  personaEmoji: { fontSize: 22 },
  personaName: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  taskContext: { fontSize: 12, color: '#6B7280', maxWidth: 220 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 16, color: '#6B7280' },
  chatArea: { flex: 1 },
  chatContent: { padding: SPACING.md },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  msgAvatarSmall: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  msgAvatarText: { fontSize: 14 },
  msgBubble: { maxWidth: '78%', borderRadius: 18, padding: 12 },
  msgText: { fontSize: 14, lineHeight: 20, color: '#1A1A2E' },
  thinkingText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  quickActions: { maxHeight: 44, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  quickActionsContent: { paddingHorizontal: SPACING.sm, paddingVertical: 6, gap: 8, alignItems: 'center' },
  quickChip: { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, maxWidth: 200 },
  quickText: { fontSize: 12, fontWeight: '600' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: SPACING.sm, gap: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: 12 },
  input: { flex: 1, backgroundColor: '#F5F3FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, maxHeight: 80, minHeight: 40, color: '#1A1A2E' },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sendArrow: { color: '#FFF', fontSize: 18, fontWeight: '800' },
});
