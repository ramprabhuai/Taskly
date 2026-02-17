import React, { useEffect, useRef } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { COLORS, RADIUS, SHADOWS } from '../../src/utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Bug 5: Pulse animation every 5 seconds
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    };
    const interval = setInterval(pulse, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.wrapper}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? COLORS.dark.tabBar : COLORS.light.tabBar,
            borderTopWidth: 0,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 4,
            paddingTop: 4,
            ...SHADOWS.sm,
            ...(Platform.OS === 'web' ? { position: 'fixed' as any, bottom: 0, left: 0, right: 0, zIndex: 10 } : {}),
          },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Tasks" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="add-fab"
          options={{
            tabBarIcon: () => <View style={{ width: 56 }} />,
            tabBarButton: () => <View style={{ width: 56 }} />,
          }}
        />
        <Tabs.Screen
          name="ai-assistant"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" label="AI" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" label="Progress" focused={focused} />,
          }}
        />
      </Tabs>

      {/* Bug 5: Global FAB - always visible on all tabs */}
      <Animated.View style={[styles.fabWrapper, { bottom: 30 + insets.bottom, transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          testID="fab-add-task"
          style={styles.fab}
          onPress={() => router.push('/add-task')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabItemFocused: {},
  tabEmoji: { fontSize: 20, opacity: 0.5 },
  tabEmojiFocused: { fontSize: 22, opacity: 1 },
  tabLabel: { fontSize: 10, color: COLORS.light.textTertiary, marginTop: 2, fontWeight: '600' },
  tabLabelFocused: { color: COLORS.primary, fontWeight: '800' },
  fabWrapper: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 100,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
  },
  fabText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
});
