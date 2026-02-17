import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { api } from '../src/utils/api';
import { COLORS, SPACING, RADIUS, SHADOWS, MASCOTS } from '../src/utils/constants';

export default function NotificationsScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) { console.log('Notif error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadNotifications(); }, []);

  const handleMarkAllRead = async () => {
    await api.markAllRead();
    loadNotifications();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🎉';
      case 'badge': return '🏆';
      case 'streak': return '🔥';
      case 'reminder': return '⏰';
      case 'motivation': return '💪';
      default: return '🔔';
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? COLORS.dark.background : COLORS.light.background }]} testID="notifications-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="notif-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>Notifications</Text>
        <TouchableOpacity testID="mark-all-read" onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={[styles.emptyText, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>
              No notifications yet!{'\n'}Complete tasks to see updates here.
            </Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const mascot = MASCOTS[notif.character as keyof typeof MASCOTS];
            return (
              <TouchableOpacity
                key={notif.notification_id}
                testID={`notif-${notif.notification_id}`}
                style={[
                  styles.notifCard,
                  { backgroundColor: isDark ? COLORS.dark.surface : COLORS.light.surface },
                  !notif.read && styles.notifUnread,
                  SHADOWS.sm,
                ]}
                onPress={async () => {
                  if (!notif.read) {
                    await api.markNotificationRead(notif.notification_id);
                    loadNotifications();
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.notifIcon}>{getTypeIcon(notif.type)}</Text>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, { color: isDark ? COLORS.dark.text : COLORS.light.text }]}>{notif.title}</Text>
                  <Text style={[styles.notifMessage, { color: isDark ? COLORS.dark.textSecondary : COLORS.light.textSecondary }]}>{notif.message}</Text>
                  <View style={styles.notifFooter}>
                    {mascot && <Text style={styles.notifMascot}>{mascot.emoji} {mascot.name}</Text>}
                    <Text style={[styles.notifTime, { color: isDark ? COLORS.dark.textTertiary : COLORS.light.textTertiary }]}>
                      {new Date(notif.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                {!notif.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { padding: 8 },
  backText: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800' },
  markAllText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  scroll: { padding: SPACING.md },
  center: { paddingTop: 80, alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  notifCard: { flexDirection: 'row', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, alignItems: 'flex-start' },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  notifIcon: { fontSize: 28, marginRight: SPACING.sm },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 15, fontWeight: '700' },
  notifMessage: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  notifFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  notifMascot: { fontSize: 11, color: COLORS.primary },
  notifTime: { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginTop: 4 },
});
