import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? COLORS.dark.tabBar : COLORS.light.tabBar,
          borderTopWidth: 0,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          ...SHADOWS.sm,
          ...(Platform.OS === 'web' ? { position: 'fixed' as any, bottom: 0, left: 0, right: 0 } : {}),
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
          tabBarIcon: ({ focused }) => (
            <View style={styles.fabContainer}>
              <View style={styles.fab}>
                <Text style={styles.fabText}>+</Text>
              </View>
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              testID="fab-add-task"
              onPress={() => router.push('/add-task')}
              activeOpacity={0.8}
            />
          ),
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
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabItemFocused: {},
  tabEmoji: { fontSize: 22, opacity: 0.5 },
  tabEmojiFocused: { fontSize: 24, opacity: 1 },
  tabLabel: { fontSize: 10, color: COLORS.light.textTertiary, marginTop: 2, fontWeight: '600' },
  tabLabelFocused: { color: COLORS.primary, fontWeight: '800' },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
